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
 * Last modified: 2020.04.06 at 13:02
 */

import {Command} from 'commander';
import inquirer from 'inquirer';
import {AppContext} from '../Core/AppContext';
import {Bugfixes} from '../Core/Bugfixes';
import {DockerApp} from '../Core/DockerApp/DockerApp';
import {DockerHosts} from '../Core/DockerApp/DockerHosts';

export class DockerComposeDownCommand
{
    public execute(cmd: Command, context: AppContext): Promise<void>
    {
        return (new DockerApp(context)).initialize().then(app => {
            return Promise.resolve()
                          .then(() => this.askForConsent(context))
                          .then((consent: boolean) => {
                              if (!consent) {
                                  console.log('Ok, aborting the process!');
                                  return Promise.resolve();
                              }
                              return app.dockerCompose.down();
                          })
                          .then(() => this.askForHostsCleanup(context))
                          .then((consent: boolean) => {
                              if (!consent) {
                                  console.log('Ok, I keep the host file as it is...');
                                  return Promise.resolve();
                              }
                
                              // Remove the entry from the hosts file
                              const hosts = new DockerHosts(context);
                              hosts.removeCurrent().write();
                
                              // Update the app hash, so we are forced to check it when we do "up" again
                              const config = context.appRegistry.get('dockerApp', {});
                              config.hash = '-1';
                              context.appRegistry.set('dockerApp', config);
                          });
        });
    }
    
    /**
     * Asks the user if he really wants to remove the containers
     * @param context
     */
    protected askForConsent(context: AppContext): Promise<boolean>
    {
        return new Promise((resolve) => {
            inquirer.prompt({
                name: 'executeDown',
                type: 'confirm',
                message: 'ATTENTION! This may be harmful! This action will destroy all instances of your application: "' +
                         context.rootDirectory + '". Do you want to proceed?',
                default: true
            }).then((answers) => {
                Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.executeDown) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
    
    /**
     * Asks if the user wants to remove the entry in the hosts file
     * @param context
     */
    protected askForHostsCleanup(context: AppContext): Promise<boolean>
    {
        return new Promise((resolve) => {
            inquirer.prompt({
                name: 'removeHosts',
                type: 'confirm',
                message: 'Should I also remove the apps entry in your hosts file? (Cleanup to permanently remove the app)',
                default: false
            }).then((answers) => {
                Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.removeHosts) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
}