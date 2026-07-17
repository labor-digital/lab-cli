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
 * Last modified: 2020.04.06 at 12:44
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeRestartCommand = void 0;
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
class DockerComposeRestartCommand {
    execute(cmd, context) {
        const dockerApp = new DockerApp_1.DockerApp(context);
        dockerApp.acceptDefaults = cmd.opts().yes === true;
        return dockerApp.initialize().then(app => {
            return (app.dockerCompose.isRunning ? app.dockerCompose.stop() : Promise.resolve())
                .then(() => app.dockerCompose.up());
        });
    }
}
exports.DockerComposeRestartCommand = DockerComposeRestartCommand;
//# sourceMappingURL=DockerComposeRestartCommand.js.map