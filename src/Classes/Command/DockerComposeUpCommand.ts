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
 * Last modified: 2020.04.05 at 18:38
 */

import * as childProcess from 'child_process';
import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {Processes} from '../Api/Processes';
import {AppContext} from '../Core/AppContext';
import {DockerApp} from '../Core/DockerApp/DockerApp';

export class DockerComposeUpCommand
{
    
    public execute(cmd: Command, context: AppContext): Promise<void>
    {
        if (cmd.opts().separateWindow === true) {
            return this.runInSeparateWindow(cmd, context);
        }
        const dockerApp = new DockerApp(context);
        dockerApp.acceptDefaults = cmd.opts().yes === true;
        dockerApp.domainOverride = cmd.opts().domain;
        dockerApp.ipOverride = cmd.opts().ip;
        return dockerApp.initialize().then(app => {
            if (cmd.opts().import === true) {
                const importDir = app.importExportDirectory;
                if (!fs.existsSync(importDir)) {
                    fs.mkdirSync(importDir, {recursive: true});
                }
                fs.writeFileSync(path.join(importDir, 'do_import'), '');
                console.log('Import marker created — import container will initialize the database.');
            }
            return app.dockerCompose.up(cmd.opts().follow === true, cmd.opts().pull === true);
        });
    }
    
    /**
     * A windows only feature to open the process in a new window
     * @param cmd
     * @param context
     */
    protected runInSeparateWindow(cmd: Command, context: AppContext): Promise<void>
    {
        const windowTitle = 'Docker process of: ' + context.rootDirectory;
        return Processes.closeWindowWithTitle(windowTitle).then(() => {
            console.log('The process has started in a new window!');
            return new Promise(resolve => {
                const command = '"' + process.argv[0] + '" ' +
                                '"' + process.argv[1] + '" ' +
                                (cmd.opts().pull === true ? ' -p' : '') +
                                ' ' + cmd.name() +
                                ' -f && timeout 10';
                childProcess.exec('start "' + windowTitle + '" ' + command);
                setTimeout(() => {
                    resolve();
                }, 1000);
            });
        });
    }
    
}