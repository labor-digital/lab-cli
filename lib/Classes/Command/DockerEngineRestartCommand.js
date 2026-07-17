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
 * Last modified: 2020.04.05 at 20:44
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerEngineRestartCommand = void 0;
const Docker_1 = require("../Api/Docker");
class DockerEngineRestartCommand {
    execute(cmd, context) {
        const api = new Docker_1.Docker(context);
        return api.restartEngine();
    }
}
exports.DockerEngineRestartCommand = DockerEngineRestartCommand;
//# sourceMappingURL=DockerEngineRestartCommand.js.map