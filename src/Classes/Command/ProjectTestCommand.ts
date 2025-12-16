/*
 * Copyright 2025 LABOR.digital
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
 * Last modified: 2025.05.06 at 14:02
 */

import {forEach} from '@labor-digital/helferlein';
import {Command} from 'commander';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import {AppContext} from '../Core/AppContext';
import {Bugfixes} from '../Core/Bugfixes';
import {CommandStack} from '../Core/Command/CommandStack';
import {DockerApp} from '../Core/DockerApp/DockerApp';

export class ProjectImportCommand
{
    public execute(cmd: Command, context: AppContext, stack: CommandStack): Promise<void>
    {
        return (new DockerApp(context)).initialize().then(app => {
            // Check if we have a test container
            let hasTestContainer = false;
            forEach(app.dockerCompose.getServiceList(), (container: { key: string, containerName: string }) => {
                if (container.key === 'test') {
                    hasTestContainer = true;
                }
            });
            if (!hasTestContainer) {
                return Promise.reject(Error(
                    'It seems like your composition does not have an "test" container. Make sure your docker compose override file defines a service with key: "test" which uses the LABOR jest-puppeteer container!'));
            }
            
            if (!app.dockerCompose.isRunning) {
                return Promise.reject(Error(
                    'It seems like your composition is not running. Please make sure to start your composition via "lab up" first.'));
            }
            
            return this.askForConsent(context).then(execute => {
                if (!execute) {
                    return Promise.resolve();
                }
                
                return app.dockerCompose.stop()
                    .then(() => {
                        console.log("Writing env var PROJECT_DEV_TEST and restart the project...");
                        app.env.set('PROJECT_DEV_TEST', 'yes');
                        return app.dockerCompose.up();
                    })
                    .then(() => {
                        return app.dockerCompose.test(cmd.update === true).catch(() => {});
                    })
                    .then(() => {
                        return app.dockerCompose.stop();
                    })
                    .then(() => {
                        console.log("Removing env var PROJECT_DEV_TEST again and restart the project...");
                        app.env.set('PROJECT_DEV_TEST', 'no');
                        return app.dockerCompose.up();
                    });
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
                message: "Do you have everything in place to run the tests (Assets built, ...)? This will restart the current project. Do you want to proceed?"
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