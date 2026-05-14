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
 * Last modified: 2020.04.06 at 14:38
 */
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
exports.DockerComposeUnisonCommand = void 0;
const radashi_1 = require("radashi");
const chalk_1 = __importDefault(require("chalk"));
// @ts-ignore
const yaml = __importStar(require("yamljs"));
const Unison_1 = require("../Api/Unison");
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
class DockerComposeUnisonCommand {
    execute(cmd, context) {
        return (new DockerApp_1.DockerApp(context)).initialize().then(app => {
            const services = app.dockerCompose.getServiceList();
            const serviceKeys = (0, radashi_1.get)(services, '*.key');
            if (serviceKeys.indexOf('docker-unison') == -1) {
                return this.migrateDockerCompose(app);
            }
            return Unison_1.Unison.startUnison(app, cmd.opts().force);
        });
    }
    /**
     * Displays the migration template
     * @param app
     */
    migrateDockerCompose(app) {
        console.log('It looks like your project is currently not set up to run with unison...');
        // Show some descriptive text
        console.log(`This setup is required to work with unison on your container:
===============================================================
To perform it manually, open your app's docker compose file: "${app.dockerComposeFile}".
1. Find your app's main service in the "services" list. It is probably has the key: "${app.serviceKey}"
2. Check if there is a "volumes" key inside the definition.
3. If so, check if there are "mounted volumes" to the following directory "${app.context.config.get('unison.migration.targetVolume')}"
   -> A mounted volume looks like: /path/on/host:/path/in/container or like an object defining "source" and "target"
4. If there are mounted volumes, remove the "host-path" (replace the object with the string: "${app.context.config.get('unison.migration.targetVolume')}").
5. Add the following definition into your list of services:`);
        // Build the template
        const targetPort = app.context.config.get('unison.target.port', 5000);
        const definition = app.context.config.get('unison.migration.definition');
        definition.depends_on.push(app.serviceKey);
        definition.volumes_from.push(app.serviceKey);
        definition.ports.push('${APP_IP}:' + targetPort + ':5000/tcp');
        let tpl = yaml.stringify(definition).split(/\r?\n/g)
            .map((v) => '      ' + v).join('\n');
        console.log(`  services:
    docker-unison:`);
        console.log(tpl);
        console.log('6. Execute "lab up" once, to start the unison container\n');
        console.log(chalk_1.default.yellowBright('Scroll up a bit...'));
        return Promise.resolve();
    }
}
exports.DockerComposeUnisonCommand = DockerComposeUnisonCommand;
//# sourceMappingURL=DockerComposeUnisonCommand.js.map