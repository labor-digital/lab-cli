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
 * Last modified: 2020.04.06 at 15:05
 */

import {isString} from '@labor-digital/helferlein/lib/Types/isString';
import chalk from 'chalk';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {DockerApp} from '../Core/DockerApp/DockerApp';

export class Unison
{
    
    /**
     * Starts the unison sync for a given docker app
     * @param app The docker app to run unison for
     * @param force True to force unison to run without archives
     */
    static startUnison(app: DockerApp, force?: boolean): Promise<void>
    {
        return new Promise<void>((resolve, reject) => {
            // Prepare options
            const additionalArgs: string = app.context.config.get('union.additionalArgs', '').trim();
            const allowNodeModules: boolean = app.context.config.get('unison.allowNodeModules', false);
            const targetPort = app.context.config.get('unison.target.port', 5000);
            const targetIp = app.context.config.get('unison.target.ip', app.env.get('APP_IP'));
            let hostPath = app.context.config.get('unison.host.directory');
            if (!isString(hostPath)) {
                if (fs.existsSync(path.join(app.context.rootDirectory, 'src'))) {
                    hostPath = path.join(app.context.rootDirectory, 'src');
                } else {
                    hostPath = app.context.rootDirectory;
                }
            }
            
            // Build the command
            const command = '"' + Unison.getUnisonExecutable(app) + '" "' + hostPath + '" ' +
                            '"socket://' + targetIp + ':' + targetPort + '" ' +
                            '-repeat watch ' +
                            (allowNodeModules ? '' : '-ignore "Name node_modules" ') +
                            '-ignore "Name *.dev-symlink-bkp" ' +
                            '-ignore "Name perms.set" ' +
                            '-prefer "' + hostPath + '" ' +
                            '-ignorecase false ' +
                            '-auto ' +
                            '-ui text ' +
                            '-links false ' +
                            '-label "APP: ' + app.context.rootDirectory + ' " ' +
                            (force ? '-ignorearchives true -ignorelocks true ' : '') +
                            ' ' + additionalArgs;
            console.log(command);
            try {
                childProcess.execSync(command, {stdio: 'inherit'});
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
    
    /**
     * Returns the absolute path to the unison executable
     * @param app
     */
    protected static getUnisonExecutable(app: DockerApp): string
    {
        return app.context.platform.choose({
            windows: () => path.join(app.context.cliDirectory, 'bin/unison/unison 2.48.4 text.exe'),
            darwin: () => {
                function isUnisonRegisteredAsCliTool(): boolean{
                    try {
                        return childProcess.execSync('which unison').toString('utf-8').indexOf('unison') !== -1
                            && childProcess.execSync('which unison-fsmonitor').toString('utf-8').indexOf('unison-fsmonitor') !== -1;
                    } catch (e) {
                        return false;
                    }
                }
                
                if(isUnisonRegisteredAsCliTool()){
                    return '/usr/local/bin/unison';
                }
                
                console.log(chalk.yellowBright('Unison is currently not installed as command line utility. You have to install it using the GUI. If it does not ask you to install the CLI utility click on: "Unison" -> "Install Command line tool". Close the GUI after you are done, in order to continue.'));
                console.log('Unison will start in 3 seconds');
                const unisonGuiExecutable = path.join(app.context.cliDirectory, 'bin/unison/darwin/Unison.app/Contents/MacOS/cltool');
                childProcess.execSync('sleep 3 && "' + unisonGuiExecutable + '"', {stdio: 'inherit'});
    
                console.log(chalk.yellowBright('Installing fs-monitor into /user/local/bin, this requires root privileges.'));
                const fsMonitorExecutable = path.join(app.context.cliDirectory, 'bin/unison/darwin/unison-fsmonitor');
                childProcess.execSync('sudo cp "' + fsMonitorExecutable + '" /usr/local/bin && chmod +x /usr/local/bin/unison-fsmonitor');
                
                if(isUnisonRegisteredAsCliTool()){
                    return '/usr/local/bin/unison';
                }
                
                throw new Error('Unison was not set up correctly!');
            }
        })();
    }
}