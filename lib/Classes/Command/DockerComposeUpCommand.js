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
 * Last modified: 2020.04.05 at 18:38
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeUpCommand = void 0;
const childProcess = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Processes_1 = require("../Api/Processes");
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
class DockerComposeUpCommand {
    execute(cmd, context) {
        if (cmd.opts().separateWindow === true) {
            return this.runInSeparateWindow(cmd, context);
        }
        const dockerApp = new DockerApp_1.DockerApp(context);
        dockerApp.acceptDefaults = cmd.opts().yes === true;
        return dockerApp.initialize().then(app => {
            if (cmd.opts().import === true) {
                const importDir = app.importExportDirectory;
                if (!fs.existsSync(importDir)) {
                    fs.mkdirSync(importDir, { recursive: true });
                }
                fs.writeFileSync(path.join(importDir, 'do_import'), '');
                console.log('Import marker created — import container will initialize the database.');
            }
            return app.dockerCompose.up(cmd.opts().follow === true, cmd.opts().pull === true);
        });
    }
    /**
     * A windows only feature to open the process in a new window
     * @param cmd
     * @param context
     */
    runInSeparateWindow(cmd, context) {
        const windowTitle = 'Docker process of: ' + context.rootDirectory;
        return Processes_1.Processes.closeWindowWithTitle(windowTitle).then(() => {
            console.log('The process has started in a new window!');
            return new Promise(resolve => {
                const command = '"' + process.argv[0] + '" ' +
                    '"' + process.argv[1] + '" ' +
                    (cmd.opts().pull === true ? ' -p' : '') +
                    ' ' + cmd.name() +
                    ' -f && timeout 10';
                childProcess.exec('start "' + windowTitle + '" ' + command);
                setTimeout(() => {
                    resolve();
                }, 1000);
            });
        });
    }
}
exports.DockerComposeUpCommand = DockerComposeUpCommand;
//# sourceMappingURL=DockerComposeUpCommand.js.map