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
 * Last modified: 2020.05.08 at 12:28
 */

import {forEach} from '@labor-digital/helferlein/lib/Lists/forEach';
import {Command} from 'commander';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as path from 'path';
import {AppContext} from '../Core/AppContext';
import {Bugfixes} from '../Core/Bugfixes';
import {CommandStack} from '../Core/Command/CommandStack';
import {DockerApp} from '../Core/DockerApp/DockerApp';

export abstract class AbstractImportExportCommand
{
    
    protected _actionFileName: 'do_import' | 'do_export';
    
    protected _consentMessage: string;
    
    public execute(cmd: Command, context: AppContext, stack: CommandStack): Promise<void>
    {
        return (new DockerApp(context)).initialize().then(app => {
            // Check if we have an import container
            let hasImportContainer = false;
            forEach(app.dockerCompose.getServiceList(), (container: { key: string, containerName: string }) => {
                if (container.key === 'import') {
                    hasImportContainer = true;
                }
            });
            if (!hasImportContainer) {
                return Promise.reject(Error(
                    'It seems like your composition does not have an "import" container. Make sure your docker-compose override file defines a service with key: "import" which uses the LABOR import container!'));
            }
            
            // Perform the import if the user consented
            return this.askForConsent(context).then(execute => {
                if (!execute) {
                    return Promise.resolve();
                }
                if (!fs.existsSync(app.importExportDirectory)) {
                    fs.mkdirSync(app.importExportDirectory);
                }
                fs.writeFileSync(path.join(app.importExportDirectory, this._actionFileName), '');
                stack.push(['up']);
                return;
            });
        });
    }
    
    /**
     * Asks the user for consent to stop all containers
     */
    protected askForConsent(context: AppContext): Promise<boolean>
    {
        return new Promise((resolve) => {
            inquirer.prompt({
                name: 'ok',
                type: 'confirm',
                message: this._consentMessage.replace(/%s/g, context.rootDirectory)
            }).then((answers) => {
                Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.ok) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
    
}