"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerEnvTemplate = void 0;
const ForEachHelper_1 = require("../Utils/ForEachHelper");
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
 * Last modified: 2020.04.07 at 13:33
 */
const DockerEnv_1 = require("./DockerEnv");
class DockerEnvTemplate extends DockerEnv_1.DockerEnv {
    /**
     * Writes the template file for the given docker .env file
     * @param env
     */
    writeTemplate(env) {
        const keepValuesFor = env.get('LAB_CLI_KEEP', '').split(',').map(v => v.trim()).filter(v => v !== '');
        keepValuesFor.push('LAB_CLI_KEEP');
        const cleaned = new Map();
        (0, ForEachHelper_1.forEach)(env.getAll(), (v, k) => {
            if (keepValuesFor.indexOf(k) === -1) {
                v = '';
            }
            cleaned.set(k, v);
        });
        this._tpl = env.tpl;
        this._env = cleaned;
        this.write(true);
    }
    /**
     * Don't do anything here...
     */
    read() {
        // Silence
    }
}
exports.DockerEnvTemplate = DockerEnvTemplate;
//# sourceMappingURL=DockerEnvTemplate.js.map