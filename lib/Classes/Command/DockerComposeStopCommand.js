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
 * Last modified: 2020.04.06 at 12:24
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeStopCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
class DockerComposeStopCommand {
    execute(cmd, context) {
        return (new DockerApp_1.DockerApp(context)).initialize().then(app => {
            if (!app.dockerCompose.isRunning) {
                console.log(chalk_1.default.yellowBright('The app is currently not running!'));
                return;
            }
            return app.dockerCompose.stop(cmd.opts().force === true);
        });
    }
}
exports.DockerComposeStopCommand = DockerComposeStopCommand;
//# sourceMappingURL=DockerComposeStopCommand.js.map