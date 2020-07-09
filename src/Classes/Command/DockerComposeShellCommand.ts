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
 * Last modified: 2020.04.06 at 13:35
 */

import {isString} from '@labor-digital/helferlein/lib/Types/isString';
import {Command} from 'commander';
import {AppContext} from '../Core/AppContext';
import {DockerApp} from '../Core/DockerApp/DockerApp';
import {DockerComposeServiceSelectWizard} from '../Core/Ui/DockerComposeServiceSelectWizard';

export class DockerComposeShellCommand
{
    
    public execute(cmd: Command, context: AppContext): Promise<void>
    {
        return (new DockerApp(context)).initialize().then(app => {
            if (!app.dockerCompose.isRunning) {
                return Promise.reject(
                    new Error('You can only attach to running apps. But the app is currently not running.'));
            }
            return (
                cmd.select ? DockerComposeServiceSelectWizard.run(app.dockerCompose, 'open a shell in') :
                    Promise.resolve(app.containerName)
            ).then((containerName: string) => {
                return app.docker.attachToContainerShell(containerName,
                    isString(cmd.shell) ? cmd.shell : context.config.get('docker.shell', 'bash'));
            });
        });
    }
}