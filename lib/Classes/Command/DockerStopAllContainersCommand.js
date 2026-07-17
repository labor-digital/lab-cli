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
 * Last modified: 2020.04.06 at 18:17
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerStopAllContainersCommand = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const Docker_1 = require("../Api/Docker");
const Bugfixes_1 = require("../Core/Bugfixes");
class DockerStopAllContainersCommand {
    execute(cmd, context) {
        return this.askForConsent().then(execute => {
            if (!execute) {
                return Promise.resolve();
            }
            return (new Docker_1.Docker(context)).stopAllContainers();
        });
    }
    /**
     * Asks the user for consent to stop all containers
     */
    askForConsent() {
        return new Promise((resolve) => {
            inquirer_1.default.prompt({
                name: 'stopAll',
                type: 'confirm',
                message: 'This will stop >ALL< currently running docker containers. Do you want to proceed?'
            }).then((answers) => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.stopAll) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
}
exports.DockerStopAllContainersCommand = DockerStopAllContainersCommand;
//# sourceMappingURL=DockerStopAllContainersCommand.js.map