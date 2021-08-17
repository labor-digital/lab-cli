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
 * Last modified: 2020.04.06 at 09:44
 */

import {forEach, isNumeric, isString, isUndefined, PlainObject} from '@labor-digital/helferlein';
import * as childProcess from 'child_process';
import {clean, gte} from 'semver';
// @ts-ignore
import * as yaml from 'yamljs';
import {DockerApp} from '../Core/DockerApp/DockerApp';
import {Network} from './Network';

export class DockerCompose
{
    /**
     * The instance of the docker app to work with
     */
    protected _app: DockerApp;
    
    /**
     * Contains the docker compose config after it was initially parsed
     */
    protected _config: PlainObject;
    
    /**
     * Stores the resolved version of docker compose
     * @protected
     */
    protected _version: string | undefined;
    
    /**
     * DockerCompose Constructor
     * @param dockerApp
     */
    public constructor(dockerApp: DockerApp)
    {
        this._app = dockerApp;
    }
    
    /**
     * Returns the version number of the currently installed docker-compose binary
     */
    public get version(): string
    {
        if (!this._version) {
            const command = 'docker-compose version --short';
            const result = childProcess.execSync(command).toString('utf8');
            this._version = clean(result);
        }
        
        return this._version;
    }
    
    /**
     * Returns the project's docker-compose configuration
     * @param forceReload Set to true to reload the config instead of serving it from cache
     */
    public getConfig(forceReload?: boolean): PlainObject
    {
        if (forceReload !== true && !isUndefined(this._config)) {
            return this._config;
        }
        
        var result = null;
        try {
            const command = this.baseDockerComposeCommand + ' config';
            result = childProcess.execSync(command).toString('utf8');
            if (result.indexOf('services') === -1) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('There are no services in the docker-compose config!');
            }
        } catch (e) {
            throw new Error('Error while reading docker-compose config:\n' + e.message);
        }
        
        // Parse yaml
        return this._config = yaml.parse(result.replace(/\t/g, '  '));
    }
    
    /**
     * Gathers a list of all services in the current docker-compose configuration
     */
    public getServiceList(forceReload?: boolean): Array<{ key: string, containerName: string }>
    {
        // Check if we can use the cached list for faster lookups
        if (forceReload !== true && this._app.context.appRegistry.has('serviceList')) {
            return this._app.context.appRegistry.get('serviceList');
        }
        
        const config = this.getConfig(forceReload);
        const services: Array<{ key: string, containerName: string }> = [];
        forEach(config.services, (service: PlainObject, k: string) => {
            if (!isString(service.container_name)) {
                return;
            }
            services.push({
                key: k,
                containerName: service.container_name
            });
        });
        this._app.context.appRegistry.set('serviceList', services);
        return services;
    }
    
    /**
     * Performs the "up" command for the current app
     *
     * @param followOutput True to follow the output if not given or false the -d arg is set
     * @param pullImages True to force pull the images used in the app before starting it
     */
    public up(followOutput?: boolean, pullImages?: boolean): Promise<void>
    {
        return new Promise<void>((resolve, reject) => {
            console.log('Starting application...');
            
            (new Network(this._app.context))
                .registerLoopBackAliasIfRequired(this._app.env.get('APP_IP'));
            
            const noAnsi = followOutput === true || !this._app.context.platform.isWindows;
            const noAnsiCommand = gte(this.version, '1.29.0') ? '--ansi never ' : '--no-ansi ';
            
            const command = this.baseDockerComposeCommand +
                            (pullImages === true ? 'pull && ' + this.baseDockerComposeCommand : '') +
                            (noAnsi ? '' : noAnsiCommand) +
                            'up --remove-orphans' + (followOutput === true ? '' : ' -d');
            
            try {
                childProcess.execSync(command, {stdio: 'inherit'});
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
    
    /**
     * Performs the "stop" command for the current app
     * @param kill True to kill the app instead of stopping it gracefully
     */
    public stop(kill?: boolean): Promise<void>
    {
        return new Promise<void>((resolve, reject) => {
            console.log('Stopping application...');
            const command = this.baseDockerComposeCommand + (kill ? 'kill' : 'stop');
            try {
                childProcess.execSync(command, {stdio: 'inherit'});
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
    
    /**
     * Executes a "docker-compose down" on the current application
     * @param removeImages True to remove all images as well
     */
    public down(removeImages?: boolean): Promise<void>
    {
        return new Promise<void>((resolve, reject) => {
            console.log('Removing application data...');
            const command = this.baseDockerComposeCommand + ' down ' +
                            (removeImages === true ? ' --rmi all' : '');
            try {
                childProcess.execSync(command, {stdio: 'inherit'});
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
    
    /**
     * Attaches the current cli to the docker compose logs
     * @param lines Optional number of lines to render
     * @param follow True to follow the logs
     */
    public attachToLogs(lines?: number, follow?: boolean): Promise<void>
    {
        return new Promise((resolve, reject) => {
            if (!isNumeric(lines)) {
                lines = 15;
            }
            const command = this.baseDockerComposeCommand + 'logs --timestamps ' +
                            '--tail="' + lines + '" ' + (follow === true ? '--follow ' : '');
            childProcess.execSync(command, {'stdio': 'inherit'});
            try {
                childProcess.execSync(command, {stdio: 'inherit'});
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
    
    /**
     * Checks if at least one of the containers in the docker-compose app is running
     */
    public get isRunning(): boolean
    {
        const command = this.baseDockerComposeCommand + 'ps';
        const content = childProcess.execSync(command, {stdio: 'pipe'}).toString('utf-8');
        const lines = content.split(/\r?\n/);
        let isRunning = false;
        forEach(lines, (line: string) => {
            if (line.charAt(0) === ' ') {
                return;
            }
            if (line.charAt(0) === '-') {
                return;
            }
            if (line.trim() === '') {
                return;
            }
            if (line.indexOf(' Exit ') !== -1) {
                return;
            }
            if (line.indexOf('Name ') === 0) {
                return;
            }
            isRunning = true;
            return false;
        });
        return isRunning;
    }
    
    /**
     * Returns the prepared docker compose base command
     */
    protected get baseDockerComposeCommand(): string
    {
        return this._app.context.platform.choose({windows: 'cd /d ', linux: 'cd '}) +
               '"' + this._app.context.rootDirectory + '" && ' +
               'docker-compose ' +
               (!isUndefined(this._app.dockerComposeFile) ?
               ' -f "' + this._app.dockerComposeFile + '"' : '') +
               (!isUndefined(this._app.dockerComposeOverrideFile) ?
               ' -f "' + this._app.dockerComposeOverrideFile + '"' : '') +
               ' ';
    }
}