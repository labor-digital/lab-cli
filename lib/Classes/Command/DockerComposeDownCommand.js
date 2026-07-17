"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeDownCommand = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const Bugfixes_1 = require("../Core/Bugfixes");
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
const DockerHosts_1 = require("../Core/DockerApp/DockerHosts");
class DockerComposeDownCommand {
    execute(cmd, context) {
        const acceptDefaults = cmd.opts().yes === true;
        const dockerApp = new DockerApp_1.DockerApp(context);
        dockerApp.acceptDefaults = acceptDefaults;
        return dockerApp.initialize().then(app => {
            return Promise.resolve()
                .then(() => this.askForConsent(context, acceptDefaults))
                .then((consent) => {
                if (!consent) {
                    console.log('Ok, aborting the process!');
                    return Promise.resolve();
                }
                return app.dockerCompose.down();
            })
                .then(() => this.askForHostsCleanup(context, acceptDefaults))
                .then((consent) => {
                if (!consent) {
                    console.log('Ok, I keep the host file as it is...');
                    return Promise.resolve();
                }
                // Remove the entry from the hosts file
                const hosts = new DockerHosts_1.DockerHosts(context);
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
    askForConsent(context, acceptDefaults = false) {
        // Non-interactive: take the prompt default (proceed with the down).
        if (acceptDefaults) {
            return Promise.resolve(true);
        }
        return new Promise((resolve) => {
            inquirer_1.default.prompt({
                name: 'executeDown',
                type: 'confirm',
                message: 'ATTENTION! This may be harmful! This action will destroy all instances of your application: "' +
                    context.rootDirectory + '". Do you want to proceed?',
                default: true
            }).then((answers) => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
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
    askForHostsCleanup(context, acceptDefaults = false) {
        // Non-interactive: take the prompt default (keep the hosts entry).
        if (acceptDefaults) {
            return Promise.resolve(false);
        }
        return new Promise((resolve) => {
            inquirer_1.default.prompt({
                name: 'removeHosts',
                type: 'confirm',
                message: 'Should I also remove the apps entry in your hosts file? (Cleanup to permanently remove the app)',
                default: false
            }).then((answers) => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.removeHosts) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
}
exports.DockerComposeDownCommand = DockerComposeDownCommand;
//# sourceMappingURL=DockerComposeDownCommand.js.map