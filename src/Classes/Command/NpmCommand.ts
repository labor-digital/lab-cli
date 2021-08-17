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
 * Last modified: 2020.04.05 at 14:48
 */

import {isString} from '@labor-digital/helferlein';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as path from 'path';
import {AppContext} from '../Core/AppContext';
import {Bugfixes} from '../Core/Bugfixes';
import {CommandStack} from '../Core/Command/CommandStack';

export class NpmCommand
{
    
    /**
     * Executes the command
     * @param run
     * @param context
     * @param stack
     * @param otherArgs
     */
    public execute(run: string, context: AppContext, stack: CommandStack, otherArgs: Array<string>): Promise<AppContext>
    {
        return this.getPackageJsonPath(context)
                   .then((packageJsonPath) =>
                       this.executeRunStatement(packageJsonPath, context, run, otherArgs));
    }
    
    /**
     * Tries to find the package json path or asks the user for one
     * @param context
     */
    protected getPackageJsonPath(context: AppContext): Promise<string>
    {
        return new Promise<string>((resolve, reject) => {
            
            // Check if the package json was defined using a path
            let packageJsonPath = context.appRegistry.get('packageJson');
            if (isString(packageJsonPath)) {
                return resolve(packageJsonPath);
            }
            
            // Check if the finder can find the file
            packageJsonPath = context.fileFinder.findPackageJson(context);
            if (isString(packageJsonPath)) {
                return resolve(packageJsonPath);
            }
            
            // Ask the user for the package.json
            this.askForPackageJsonPath(context).then(resolve).catch(reject);
        });
    }
    
    /**
     * Mail logic that handles the redirection of the request to the npm script
     *
     * @param packageJsonPath
     * @param context
     * @param run
     * @param otherArgs
     */
    protected executeRunStatement(
        packageJsonPath: string,
        context: AppContext,
        run: string,
        otherArgs: Array<string>
    ): Promise<AppContext>
    {
        // Get the contents
        const pJson = JSON.parse(fs.readFileSync(packageJsonPath).toString('utf-8'));
        const scripts = Object.keys(typeof pJson !== 'undefined' && typeof pJson.scripts === 'object' ?
            pJson.scripts : {});
        
        // Check if help was requested
        const message = scripts.length === 0 ? 'Your package.json does not contain any scripts!'
            : 'Your package.json file contains the following scripts: "' +
              scripts.join('", "') + '"';
        if (run === '' || run === '.' || run === '?') {
            console.log(message);
            return Promise.resolve(context);
        }
        
        // Check if the given script is known
        let npmScriptCommand = 'npm run "' + run + '"';
        if (scripts.indexOf(run) === -1) {
            // Check if this is a special command
            const npmCommands = [
                'access', 'adduser', 'audit', 'bin', 'bugs', 'c', 'cache', 'ci', 'cit',
                'clean-install', 'clean-install-test', 'completion', 'config',
                'create', 'ddp', 'dedupe', 'deprecate', 'dist-tag', 'docs', 'doctor',
                'edit', 'explore', 'get', 'help', 'help-search', 'hook', 'i', 'init',
                'install', 'install-ci-test', 'install-test', 'it', 'link', 'list', 'ln',
                'login', 'logout', 'ls', 'org', 'outdated', 'owner', 'pack', 'ping', 'prefix',
                'profile', 'prune', 'publish', 'rb', 'rebuild', 'repo', 'restart', 'root',
                'run', 'run-script', 's', 'se', 'search', 'set', 'shrinkwrap', 'star',
                'stars', 'start', 'stop', 't', 'team', 'test', 'token', 'tst', 'un',
                'uninstall', 'unpublish', 'unstar', 'up', 'update', 'v', 'version', 'view',
                'whoami'
            ];
            if (npmCommands.indexOf(run) !== -1) {
                npmScriptCommand = 'npm ' + run;
            } else {
                return Promise.reject(new Error('Could not find npm script! ' + message));
            }
        }
        
        // Execute the script
        childProcess.execSync(
            'cd "' + path.dirname(packageJsonPath) + '" && ' +
            npmScriptCommand + ' ' +
            otherArgs.join(' '), {'stdio': 'inherit'});
        
        // Done
        return Promise.resolve(context);
    }
    
    /**
     * Handles the inquirer request to ask the user for a package json path
     * @param context
     */
    protected askForPackageJsonPath(context: AppContext): Promise<string>
    {
        return inquirer.prompt([
            {
                name: 'configurePath',
                type: 'confirm',
                message: 'Could not find a package.json for the current app. Can you show me where to find it?'
            },
            {
                name: 'packageJson',
                type: 'input',
                message: 'Okay then, please specify the path to your package.json',
                when: answers => answers.configurePath === true,
                validate: input => {
                    if (fs.existsSync(input) && input.match(/package\.json$/)) {
                        return true;
                    }
                    return 'The given package.json file was not found or not readable';
                }
            }
        ]).then(answers => {
            Bugfixes.inquirerChildProcessReadLineFix();
            
            if (!answers.configurePath) {
                return Promise.reject(new Error('Sorry, but I can\'t help you without a package.json'));
            }
            
            // Store the package json in the app file if possible
            context.appRegistry.set('packageJson', answers.packageJson);
            
            // Done
            return Promise.resolve(answers.packageJson);
        });
    }
}