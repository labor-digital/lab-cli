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
 * Last modified: 2020.04.05 at 22:40
 */
import inquirer from 'inquirer';
import {AppContext} from '../AppContext';
import {Bugfixes} from '../Bugfixes';

export class ProjectNameInputWizard
{
    
    /**
     * Asks the user for the project name and generates it based on multiple options
     */
    public static run(initialQuestion: string, context: AppContext): Promise<string>
    {
        return new Promise<string>((resolve, reject) => {
            inquirer.prompt([
                {
                    name: 'projectNameInputType',
                    type: 'list',
                    message: initialQuestion,
                    default: 'folder',
                    choices: [
                        {
                            name: 'Detect by current folder structure',
                            value: 'folder'
                        },
                        {
                            name: 'Use the wizard',
                            value: 'wizard'
                        },
                        {
                            name: 'Input the name as a string (customer-project-app)',
                            value: 'manual'
                        },
                        {
                            name: 'Input a custom name as string',
                            value: 'custom'
                        },
                        {
                            name: 'I don\'t care. Make it quick, I want to test something...',
                            value: 'playground'
                        }
                    ]
                },
                {
                    name: 'projectName',
                    type: 'input',
                    when: answers => answers.projectNameInputType === 'custom',
                    message: 'Project name, any kind of string (should be URL compatible!)',
                    filter: input => input.trim().toLowerCase(),
                    validate: input => {
                        if (input.length === 0) {
                            return 'The input can\'t be empty!';
                        }
                        if (input.replace(/[^0-9_\-a-z.]/g, '') !==
                            input) {
                            return 'The name can only be alpha numerical with dashes, periods and underscores';
                        }
                        return true;
                    }
                },
                {
                    name: 'projectName',
                    type: 'input',
                    when: answers => answers.projectNameInputType === 'manual',
                    message: 'Project name, like "customer_name-project_name-app_name"',
                    filter: input => input.trim().toLowerCase(),
                    validate: input => {
                        if (input.length === 0) {
                            return 'The input can\'t be empty!';
                        }
                        if (input.replace(/[^-]/g, '').length !==
                            2) {
                            return 'The name should consist of three parts, separated with a dash!';
                        }
                        if (input.replace(/[^0-9_\-a-z]/g, '') !==
                            input) {
                            return 'The name can only be alpha numerical with dashes and underscores';
                        }
                        return true;
                    }
                },
                {
                    name: 'wizCustomerName',
                    type: 'input',
                    when: answers => answers.projectNameInputType === 'wizard',
                    message: 'Customer name, like "Customer Company", "Customer", "customer"...',
                    filter: ProjectNameInputWizard.wizardInputFilter,
                    validate: ProjectNameInputWizard.wizardInputValidate
                },
                {
                    name: 'wizProjectName',
                    type: 'input',
                    when: answers => answers.projectNameInputType === 'wizard',
                    message: 'Project name, like "Website Relaunch", "Marketing"...',
                    filter: ProjectNameInputWizard.wizardInputFilter,
                    validate: ProjectNameInputWizard.wizardInputValidate
                },
                {
                    name: 'wizAppName',
                    type: 'input',
                    when: answers => answers.projectNameInputType === 'wizard',
                    message: 'App name, like "Website", "Portal", "Typo"...',
                    filter: ProjectNameInputWizard.wizardInputFilter,
                    validate: ProjectNameInputWizard.wizardInputValidate
                }
            ]).then(answers => {
                
                // Get projectName based on user input
                let projectName = '';
                if (answers.projectNameInputType === 'wizard') {
                    projectName = answers.wizCustomerName + '-' + answers.wizProjectName + '-' + answers.wizAppName;
                } else if (answers.projectNameInputType === 'manual' || answers.projectNameInputType === 'custom') {
                    projectName = answers.projectName;
                } else if (answers.projectNameInputType === 'playground') {
                    projectName = 'playground-' + (Math.floor(Math.random() * 99999) + (new Date()).getTime()) + '-' +
                                  (Math.floor(Math.random() * 99999));
                } else {
                    const path = context.rootDirectory.replace(/[\\\/]/g, '|').split('|');
                    const parts = [];
                    while (parts.length < 3) {
                        const part = path.pop();
                        if (part === 'app') {
                            continue;
                        }
                        if (part === '') {
                            continue;
                        }
                        if (typeof part === 'undefined') {
                            return reject(
                                'Could not read project name by directory, because the path is to short!');
                        }
                        parts.push(ProjectNameInputWizard.wizardInputFilter(part));
                    }
                    projectName = parts.reverse().join('-');
                }
                
                // Ask if everything is fine
                return inquirer.prompt([
                    {
                        name: 'ok',
                        type: 'confirm',
                        message: 'Is this the project-name you would like to use? "' + projectName + '"?',
                        default: true
                    }
                ]).then(answers => {
                    Bugfixes.inquirerChildProcessReadLineFix();
                    if (!answers.ok) {
                        ProjectNameInputWizard.run(initialQuestion, context).then(resolve);
                    } else {
                        return resolve(projectName);
                    }
                });
            });
        });
    }
    
    /**
     * Filters the wizard input for umlauts and special characters
     * @param input
     */
    protected static wizardInputFilter(input: string): string
    {
        input = input.trim().toLowerCase().replace(/\s+/g, ' ');
        input = input.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
        input = input.replace(/\s/, '_');
        return input;
    }
    
    /**
     * Validates the input of a wizard question
     * @param input
     */
    protected static wizardInputValidate(input: string): string | boolean
    {
        if (input.length === 0) {
            return 'The input can\'t be empty!';
        }
        if (input.replace(/[^0-9_\-a-z]/g, '') !==
            input) {
            return 'The name can only be alpha numerical with underscores';
        }
        return true;
    }
}
