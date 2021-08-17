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
 * Last modified: 2020.07.09 at 18:26
 */

import {forEach, isArray, isEmpty, isPlainObject, isString, PlainObject} from '@labor-digital/helferlein';
import {copy} from '@labor-digital/helferlein/dist/Node/FileSystem/copySync';
import {mkdirRecursiveSync} from '@labor-digital/helferlein/dist/Node/FileSystem/mkdirRecursiveSync';
import {rmdirRecursiveSync} from '@labor-digital/helferlein/dist/Node/FileSystem/rmdirRecursiveSync';
import chalk from 'chalk';
import {Command} from 'commander';
import * as fs from 'fs';
import glob from 'glob';
import inquirer from 'inquirer';
import * as path from 'path';
import {Git} from '../Api/Git';
import {AppContext} from '../Core/AppContext';
import {Bugfixes} from '../Core/Bugfixes';
import {ProjectNameInputWizard} from '../Core/Ui/ProjectNameInputWizard';

interface BoilerplateDefinition
{
    name: string,
    path: string,
    replaceProjectNameIn?: Array<string>
}

export class ProjectInitCommand
{
    public execute(cmd: Command, context: AppContext): Promise<void>
    {
        
        // Prepare git
        const git = new Git(context);
        if (!git.isInstalled()) {
            console.log(chalk.redBright('You have to have git installed to run this command!'));
        }
        
        // Prepare values
        let target = context.cwd.replace(/[\\\/]+$/, '');
        let checkoutTarget = target;
        let projectName: string | null = null;
        let boilerplate: BoilerplateDefinition | null = null;
        
        // Check if the directory is empty
        return new Promise(resolve => {
            if (fs.readdirSync(target).length !== 0) {
                inquirer.prompt({
                    name: 'flushDirectory',
                    type: 'confirm',
                    message: 'The target directory: "' + target +
                             '" is not empty! **This operation will delete everything in your ' +
                             'directory!** Do you really want to proceed?'
                }).then((answers) => {
                    Bugfixes.inquirerChildProcessReadLineFix();
                    if (!answers.flushDirectory) {
                        return resolve(false);
                    }
                    console.log('Flushing the contents of the target directory...');
                    rmdirRecursiveSync(target, false);
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        })
            
            // Create an app directory and go there
            .then(execute => {
                if (!execute) {
                    return Promise.reject(false);
                }
                target = path.join(target, 'app');
                mkdirRecursiveSync(target);
                process.chdir(target);
            })
            
            // Ask for the project name
            .then(() => {
                return ProjectNameInputWizard.run(
                    'Your new project needs a name, we use as "COMPOSE_PROJECT_NAME". ' +
                    'Define the name of the project based on the following options:', context)
                                             .then(name => {
                                                 projectName = name;
                                             });
            })
            // Clone the repository
            .then(() => {
                const repository = context.config.get('projectInit.boilerplateRepository');
                console.log('Cloning the repository: ' + repository);
                checkoutTarget = path.join(checkoutTarget, '.clone');
                git.clone(repository, checkoutTarget);
            })
            // Find boilerplates
            .then(() => {
                // Find the possible locations
                const boilerplates: Map<string, BoilerplateDefinition> = new Map();
                const boilerplateFiles = glob.sync('**/lab.boilerplate.json', {absolute: true, cwd: checkoutTarget});
                forEach(boilerplateFiles, (boilerplateFile: string) => {
                    const content = fs.readFileSync(boilerplateFile).toString('utf-8');
                    const definition: BoilerplateDefinition = JSON.parse(content);
                    if (!isPlainObject(definition)) {
                        console.error('Invalid boiler plate at: ' + boilerplateFile);
                        return;
                    }
                    if (!isString(definition.name) || isEmpty(definition.name)) {
                        console.error('Invalid boiler plate at: ' + boilerplateFile + ', "name" is a required field!');
                        return;
                    }
                    definition.path = path.dirname(boilerplateFile);
                    boilerplates.set(boilerplateFile, definition);
                });
                
                // Skip if there are no boilerplates
                if (boilerplates.size === 0) {
                    console.error('There are no boilerplates in the cloned repository!');
                    return Promise.reject(false);
                }
                return boilerplates;
            })
            // Ask the user for the boilerplate to use
            .then((boilerplates) => {
                return inquirer.prompt([
                        {
                            name: 'boilerplate',
                            type: 'list',
                            message: 'Which template (Branch) should I use to create your project with?',
                            when: () => boilerplates.size > 1,
                            choices: () => {
                                const choices: Array<PlainObject> = [];
                                forEach(boilerplates, (boilerplate: BoilerplateDefinition) => {
                                    choices.push({
                                        name: boilerplate.name,
                                        value: boilerplate
                                    });
                                });
                                return choices;
                            }
                        }
                    ]
                ).then(answers => {
                    Bugfixes.inquirerChildProcessReadLineFix();
                    // Auto-select branch if required
                    if (!isPlainObject(answers.boilerplate)) {
                        boilerplate = boilerplates.values().next().value;
                    } else {
                        boilerplate = answers.boilerplate;
                    }
                });
            })
            // Copy the boilerplate code to the app directory
            .then(() => {
                copy(boilerplate.path, target);
                // Remove the boilerplate definition
                fs.unlinkSync(path.join(target, 'lab.boilerplate.json'));
            })
            // Apply the post processing
            .then(() => {
                function replacePlaceholderIn(filename: string, regex: RegExp, value: string)
                {
                    if (!fs.existsSync(filename)) {
                        return;
                    }
                    let envDev = fs.readFileSync(filename).toString('utf-8');
                    envDev = envDev.replace(regex, value);
                    fs.writeFileSync(filename, envDev);
                }
                
                function replaceProjectNameIn(filename: string)
                {
                    replacePlaceholderIn(filename, /§PROJECT_NAME§|{{PROJECT_NAME}}/g, projectName + '');
                }
                
                // Check if we have stuff to replace
                if (isArray(boilerplate.replaceProjectNameIn)) {
                    forEach(boilerplate.replaceProjectNameIn, (filename: string) => {
                        filename = path.join(target, filename);
                        replaceProjectNameIn(filename);
                    });
                }
            })
            // Remove the checkout directory
            .then(() => {
                rmdirRecursiveSync(checkoutTarget);
            })
            // Create local git repository
            .then(() => {
                git.initializeRepo(target);
            })
            // Done
            .then(() => {
                console.log(chalk.greenBright(
                    'All done! Created a new project: "' + projectName + '" at: ' + target + ' using the "' +
                    boilerplate.name + '" boilerplate! You can now go there an start it with ' +
                    '"lab up" - Happy coding :D'));
            })
            .catch((state: boolean) => {
                if (state === false) {
                    console.log('Ok, aborting the process!');
                    return Promise.resolve();
                }
                return Promise.reject();
            });
    }
}