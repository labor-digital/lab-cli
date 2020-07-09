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
 * Last modified: 2020.04.06 at 18:17
 */

import {Command} from 'commander';
import inquirer from 'inquirer';
import {Docker} from '../Api/Docker';
import {AppContext} from '../Core/AppContext';
import {Bugfixes} from '../Core/Bugfixes';

export class DockerStopAllContainersCommand
{
    
    public execute(cmd: Command, context: AppContext): Promise<void>
    {
        return this.askForConsent().then(execute => {
            if (!execute) {
                return Promise.resolve();
            }
            return (new Docker(context)).stopAllContainers();
        });
    }
    
    /**
     * Asks the user for consent to stop all containers
     */
    protected askForConsent(): Promise<boolean>
    {
        return new Promise((resolve) => {
            inquirer.prompt({
                name: 'stopAll',
                type: 'confirm',
                message: 'This will stop >ALL< currently running docker containers. Do you want to proceed?'
            }).then((answers) => {
                Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.stopAll) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
}