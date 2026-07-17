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
 * Last modified: 2020.04.06 at 13:35
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeShellCommand = void 0;
const radashi_1 = require("radashi");
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
const DockerComposeServiceSelectWizard_1 = require("../Core/Ui/DockerComposeServiceSelectWizard");
class DockerComposeShellCommand {
    execute(cmd, context) {
        return (new DockerApp_1.DockerApp(context)).initialize().then(app => {
            if (!app.dockerCompose.isRunning) {
                return Promise.reject(new Error('You can only attach to running apps. But the app is currently not running.'));
            }
            return (cmd.opts().select ? DockerComposeServiceSelectWizard_1.DockerComposeServiceSelectWizard.run(app.dockerCompose, 'open a shell in') :
                Promise.resolve(app.containerName)).then((containerName) => {
                return app.docker.attachToContainerShell(containerName, (0, radashi_1.isString)(cmd.opts().shell) ? cmd.opts().shell : context.config.get('docker.shell', 'bash'));
            });
        });
    }
}
exports.DockerComposeShellCommand = DockerComposeShellCommand;
//# sourceMappingURL=DockerComposeShellCommand.js.map