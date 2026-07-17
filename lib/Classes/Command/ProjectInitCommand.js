"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectInitCommand = void 0;
const ForEachHelper_1 = require("../Core/Utils/ForEachHelper");
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
const radashi_1 = require("radashi");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const glob_1 = require("glob");
const inquirer_1 = __importDefault(require("inquirer"));
const path = __importStar(require("path"));
const Git_1 = require("../Api/Git");
const Bugfixes_1 = require("../Core/Bugfixes");
const ProjectNameInputWizard_1 = require("../Core/Ui/ProjectNameInputWizard");
class ProjectInitCommand {
    execute(cmd, context) {
        // Prepare git
        const git = new Git_1.Git(context);
        if (!git.isInstalled()) {
            console.log(chalk_1.default.redBright('You have to have git installed to run this command!'));
        }
        // Prepare values
        let target = context.cwd.replace(/[\\\/]+$/, '');
        let checkoutTarget = target;
        let projectName = null;
        let projectShortName = null;
        let boilerplate = null;
        // Check if the directory is empty
        return new Promise(resolve => {
            if (fs.readdirSync(target).length !== 0) {
                if (cmd.opts().force) {
                    console.log('Flushing the contents of the target directory...');
                    fs.rmSync(target, { recursive: true, force: true });
                    return resolve(true);
                }
                inquirer_1.default.prompt({
                    name: 'flushDirectory',
                    type: 'confirm',
                    message: 'The target directory: "' + target +
                        '" is not empty! **This operation will delete everything in your ' +
                        'directory!** Do you really want to proceed?'
                }).then((answers) => {
                    Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                    if (!answers.flushDirectory) {
                        return resolve(false);
                    }
                    console.log('Flushing the contents of the target directory...');
                    fs.rmSync(target, { recursive: true, force: true });
                    resolve(true);
                });
            }
            else {
                resolve(true);
            }
        })
            // Create an app directory and go there
            .then(execute => {
            if (!execute) {
                return Promise.reject(false);
            }
            target = path.join(target, 'app');
            fs.mkdirSync(target, { recursive: true });
            process.chdir(target);
        })
            // Ask for the project name
            .then(() => {
            return ProjectNameInputWizard_1.ProjectNameInputWizard.run('Your new project needs a name, we use as "COMPOSE_PROJECT_NAME". ' +
                'Define the name of the project based on the following options:', context, cmd.opts().name)
                .then(name => {
                projectName = name;
                projectShortName = projectName
                    .trim()
                    .split('-')
                    .map(v => v.replace(/_/, '').trim().substring(0, 3))
                    .join('_')
                    .toLowerCase();
            });
        })
            // Clone the repository
            .then(() => {
            const repository = context.config.get('projectInit.boilerplateRepository');
            console.log('Cloning the repository: ' + repository);
            checkoutTarget = path.join(checkoutTarget, '.clone');
            git.clone(repository, checkoutTarget);
            console.log('Cloning done.');
        })
            // Find boilerplates
            .then(() => {
            // Find the possible locations
            console.log('Searching for boilerplates...');
            const boilerplates = new Map();
            try {
                const boilerplateFiles = (0, glob_1.globSync)('**/lab.boilerplate.json', { absolute: true, cwd: checkoutTarget });
                (0, ForEachHelper_1.forEach)(boilerplateFiles, (boilerplateFile) => {
                    const content = fs.readFileSync(boilerplateFile).toString('utf-8');
                    const definition = JSON.parse(content);
                    if (!(0, radashi_1.isObject)(definition)) {
                        console.error('Invalid boiler plate at: ' + boilerplateFile);
                        return;
                    }
                    if (!(0, radashi_1.isString)(definition.name) || (0, radashi_1.isEmpty)(definition.name)) {
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
            }
            catch (error) {
                console.error('Failed to find boilerplates:', error);
                throw error;
            }
        })
            // Ask the user for the boilerplate to use
            .then((boilerplates) => {
            if (cmd.opts().boilerplate) {
                let found = false;
                for (const bp of boilerplates.values()) {
                    if (bp.name === cmd.opts().boilerplate) {
                        boilerplate = bp;
                        found = true;
                        break;
                    }
                }
                if (found) {
                    return Promise.resolve();
                }
                console.log(chalk_1.default.yellow('Could not find boilerplate with name: "' + cmd.opts().boilerplate + '". Falling back to selection.'));
            }
            return inquirer_1.default.prompt([
                {
                    name: 'boilerplate',
                    type: 'select',
                    message: 'Which template (Branch) should I use to create your project with?',
                    when: () => boilerplates.size > 1,
                    choices: () => {
                        const choices = [];
                        for (const boilerplate of boilerplates.values()) {
                            choices.push({
                                name: boilerplate.name,
                                value: boilerplate
                            });
                        }
                        return choices;
                    }
                }
            ]).then(answers => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                // Auto-select branch if required
                if (!(0, radashi_1.isObject)(answers.boilerplate)) {
                    boilerplate = boilerplates.values().next().value;
                }
                else {
                    boilerplate = answers.boilerplate;
                }
            });
        })
            // Copy the boilerplate code to the app directory
            .then(() => {
            fs.cpSync(boilerplate.path, target, { recursive: true });
            // Remove the boilerplate definition
            fs.unlinkSync(path.join(target, 'lab.boilerplate.json'));
        })
            // Apply the post processing
            .then(() => {
            function replacePlaceholderIn(filename, regex, value) {
                if (!fs.existsSync(filename)) {
                    return;
                }
                let envDev = fs.readFileSync(filename).toString('utf-8');
                envDev = envDev.replace(regex, value);
                fs.writeFileSync(filename, envDev);
            }
            function replaceProjectNameIn(filename) {
                replacePlaceholderIn(filename, /§PROJECT_NAME§|{{PROJECT_NAME}}/g, projectName + '');
                replacePlaceholderIn(filename, /§PROJECT_SHORT_NAME§|{{PROJECT_SHORT_NAME}}/g, projectShortName + '');
            }
            // Check if we have stuff to replace
            if ((0, radashi_1.isArray)(boilerplate.replaceProjectNameIn)) {
                (0, ForEachHelper_1.forEach)(boilerplate.replaceProjectNameIn, (filename) => {
                    filename = path.join(target, filename);
                    replaceProjectNameIn(filename);
                });
            }
        })
            // Remove the checkout directory
            .then(() => {
            fs.rmSync(checkoutTarget, { recursive: true, force: true });
        })
            // Create local git repository
            .then(() => {
            git.initializeRepo(target);
        })
            // Done
            .then(() => {
            console.log(chalk_1.default.greenBright('All done! Created a new project: "' + projectName + '" at: ' + target + ' using the "' +
                boilerplate.name + '" boilerplate! You can now go there an start it with ' +
                '"lab up" - Happy coding :D'));
        })
            .catch((state) => {
            if (state === false) {
                console.log('Ok, aborting the process!');
                return Promise.resolve();
            }
            return Promise.reject();
        });
    }
}
exports.ProjectInitCommand = ProjectInitCommand;
//# sourceMappingURL=ProjectInitCommand.js.map