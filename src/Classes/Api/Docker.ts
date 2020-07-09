/*
 * Copyright 2020 LABOR.digital
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Last modified: 2020.04.05 at 18:51
 */

import {PlainObject} from '@labor-digital/helferlein/lib/Interfaces/PlainObject';
import {forEach} from '@labor-digital/helferlein/lib/Lists/forEach';
import {isNull} from '@labor-digital/helferlein/lib/Types/isNull';
import chalk from 'chalk';
import * as childProcess from 'child_process';
// @ts-ignore
import DockerApi from 'dockerode';
import * as fs from 'fs';
import * as path from 'path';
import {AppContext} from '../Core/AppContext';
import {ElevatedProcess} from './ElevatedProcess';
import {Processes} from './Processes';

export class Docker
{
    
    /**
     * The context object of this docker api instance
     */
    protected _context: AppContext;
    
    /**
     * The static api instance after it was created
     */
    protected _api: DockerApi.Docker;
    
    /**
     * Docker Constructor
     * @param context
     */
    public constructor(context: AppContext)
    {
        this._context = context;
        this._api = new DockerApi({
            socketPath: context.config.get('docker.socketPath')
        });
    }
    
    /**
     * Returns true if docker is installed, false if not
     */
    public get isInstalled(): boolean
    {
        try {
            return this._context.platform.choose({
                windows: () => {
                    return childProcess.execSync('where docker', {'stdio': 'pipe'})
                                       .toString('utf8').indexOf('docker.exe') !== -1;
                },
                linux: () => {
                    return childProcess.execSync('which docker', {'stdio': 'pipe'})
                                       .toString('utf8').indexOf('docker') !== -1;
                }
            })();
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Returns true if the docker engine is currently running
     */
    public get isRunning(): boolean
    {
        try {
            return childProcess.execSync('docker ps', {'stdio': 'pipe'})
                               .toString('utf8').indexOf('CONTAINER ID') === 0;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Will start the docker engine (vm and "Docker for Windows") if it is currently not running.
     */
    public startEngine(): Promise<void>
    {
        return new Promise<void>((resolve, reject) => {
            // Start the process
            this._context.platform.choose({
                windows: () => {
                    // Find the docker root path
                    const executableParts = childProcess.execSync('WHERE docker', {'stdio': 'pipe'})
                                                        .toString('utf8')
                                                        .split(/\r?\n/);
                    const rootPath = path.dirname(path.dirname(path.dirname(executableParts[0].trim()))) + path.sep;
                    
                    // Check if we can find an executable
                    const options = [
                        rootPath + path.sep + 'Docker Desktop.exe',
                        rootPath + path.sep + 'Docker for Windows.exe',
                        executableParts[0].trim()
                    ];
                    let executablePath = null;
                    for (let i = 0; i < options.length; i++) {
                        if (!fs.existsSync(options[i])) {
                            continue;
                        }
                        executablePath = options[i];
                        break;
                    }
                    if (isNull(executablePath)) {
                        throw new Error('Could not find a matching docker executable!');
                    }
                    
                    // Prepare command
                    var command = 'start /b "" "' + executablePath + '"';
                    childProcess.exec(command, () => {
                    });
                },
                linux: () => {
                    const elevator = new ElevatedProcess(this._context);
                    try {
                        elevator.exec('/etc/init.d/docker start');
                    } catch (e) {
                        try {
                            elevator.exec('service docker start');
                        } catch (e) {
                            try {
                                elevator.exec('systemctl start docker');
                            } catch (e) {
                                throw new Error('Failed to start docker engine!');
                            }
                        }
                    }
                }
            })();
            
            // Wait until the process is up and running
            console.log('Waiting until docker engine is started...');
            let interval: any = 0;
            let timeout = 200;
            interval = setInterval(() => {
                if (--timeout < 0) {
                    clearTimeout(interval);
                    return reject(new Error('Timeout while starting docker engine!'));
                }
                
                if (!this.isRunning) {
                    return;
                }
                clearInterval(interval);
                console.log(chalk.greenBright('Docker engine successfully started!'));
                setTimeout(() => {
                    console.log('Stopping all autostarted containers...');
                    this.stopAllContainers().then(() => {
                        resolve();
                    }).catch(reject);
                }, 2000);
            }, 5000);
        });
    }
    
    /**
     * Stops the docker engine and the hyper-v vm
     * @param force Set true to ignore the current "running" state
     */
    public stopEngine(force?: boolean): Promise<void>
    {
        return this.timeoutHandler(() => {
            return new Promise((resolve, reject) => {
                this._context.platform.choose({
                    windows: () => {
                        if (force !== true && !this.isRunning) {
                            return resolve();
                        }
                        
                        // Stop the vm and restart the docker service
                        console.log('Stopping VM and docker service...');
                        var commands = [
                            'powershell -command "& {&\'Stop-VM\' MobyLinuxVM -ErrorAction SilentlyContinue}";',
                            'powershell -command "& {&\'Stop-VM\' DockerDesktopVM -ErrorAction SilentlyContinue}";',
                            'powershell -command "& {&\'restart-service\' com.docker.service}";'
                        ];
                        (new ElevatedProcess(this._context)).execMultiple(commands);
                        console.log('Stopping docker processes...');
                        Processes.killByFilter('ImageName eq docker*').then(() => resolve(true)).catch(reject);
                    }
                })();
            });
        }, 60 * 2 * 1000);
    }
    
    /**
     * Stops the docker engine if it is currently running and starts it again.
     */
    public restartEngine(): Promise<void>
    {
        return this.stopEngine().then(() => this.startEngine());
    }
    
    /**
     * Attaches the cli to the shell of a given container
     * @param containerName The container name of the container to attach to
     * @param shell The name of the shell to attach to
     */
    public attachToContainerShell(containerName: string, shell: string): Promise<void>
    {
        return new Promise((resolve, reject) => {
            console.log(chalk.yellowBright(
                'Attaching to shell of: ' + containerName + ' - To close the shell type "exit" and hit enter.'));
            try {
                const command = 'docker exec -ti ' + containerName + ' ' + shell;
                childProcess.execSync(command, {stdio: 'inherit'});
                resolve();
            } catch (e) {
                if (e.status !== 1) {
                    return resolve();
                }
                return reject(e);
            }
        });
    }
    
    /**
     * Stops all currently running containers
     */
    public stopAllContainers(): Promise<void>
    {
        return this.timeoutHandler(() => {
            return this._api.listContainers()
                       .then((containers: Array<PlainObject>) => {
                           const promises: Array<Promise<any>> = [];
                           forEach(containers, (container: PlainObject) => {
                               console.log('Stopping container: ' + container.Id + '...');
                               promises.push(this._api.getContainer(container.Id).stop());
                           });
                           return Promise.all(promises);
                       });
        }, 60 * 1000);
    }
    
    /**
     * Internal helper to call a callback that times out after a given number of milli seconds
     * @param callback The callback to execute
     * @param timeout the timout after which the script fails (milli seconds)
     */
    protected timeoutHandler(callback: Function, timeout: number): Promise<void>
    {
        return new Promise<void>((resolve, reject) => {
            const eventName = 'timeout-' + Math.random() + Math.random();
            const timeoutId = setTimeout(() => {
                reject(new Error('The action took too long and exceeded the timeout: ' + timeout));
                this._context.eventEmitter.unbindAll(eventName);
            }, timeout);
            this._context.eventEmitter.bind(eventName, function () {
                return callback();
            });
            this._context.eventEmitter.emitHook(eventName, {}).then(() => {
                clearTimeout(timeoutId);
                this._context.eventEmitter.unbindAll(eventName);
                resolve();
            }).catch(reject);
        });
    }
}