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
exports.AbstractImportExportCommand = void 0;
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
 * Last modified: 2020.05.08 at 12:28
 */
const child_process_1 = __importDefault(require("child_process"));
const fs = __importStar(require("fs"));
const inquirer_1 = __importDefault(require("inquirer"));
const path = __importStar(require("path"));
const Bugfixes_1 = require("../Core/Bugfixes");
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
class AbstractImportExportCommand {
    execute(cmd, context, stack) {
        const acceptDefaults = cmd.opts().yes === true;
        const dockerApp = new DockerApp_1.DockerApp(context);
        dockerApp.acceptDefaults = acceptDefaults;
        return dockerApp.initialize().then(app => {
            // Check if we have an import container
            let hasImportContainer = false;
            (0, ForEachHelper_1.forEach)(app.dockerCompose.getServiceList(), (container) => {
                if (container.key === 'import') {
                    hasImportContainer = true;
                }
            });
            if (!hasImportContainer) {
                return Promise.reject(Error('It seems like your composition does not have an "import" container. Make sure your docker compose override file defines a service with key: "import" which uses the LABOR import container!'));
            }
            // Perform the import if the user consented
            return this
                .askForConsent(context, acceptDefaults)
                .then(execute => {
                if (!execute) {
                    return Promise.reject();
                }
                return Promise.resolve();
            })
                .then(() => {
                return app.dockerCompose.stop();
            })
                .then(() => {
                if (cmd.opts().copyFromTest !== true) {
                    return Promise.resolve();
                }
                console.log('Copying the test-data directory to the import directory...');
                if (fs.existsSync(app.importExportDirectory)) {
                    child_process_1.default.execSync('rm -rf ' + path.join(app.importExportDirectory, '*'));
                }
                if (!fs.existsSync(app.importExportDirectory)) {
                    fs.mkdirSync(app.importExportDirectory);
                }
                fs.cpSync(path.join(app.testDirectory, 'test-data'), app.importExportDirectory, { recursive: true });
                return Promise.resolve();
            })
                .then(() => {
                if (!fs.existsSync(app.importExportDirectory)) {
                    fs.mkdirSync(app.importExportDirectory);
                }
                return Promise.resolve();
            })
                .then(() => {
                fs.writeFileSync(path.join(app.importExportDirectory, this._actionFileName), '');
                return Promise.resolve();
            })
                .then(() => {
                return app.dockerCompose.up();
            })
                .then(() => {
                if (cmd.opts().copyToTest !== true) {
                    return Promise.resolve();
                }
                console.log('Copying the exported files to the test-data directory...');
                if (fs.existsSync(path.join(app.testDirectory, 'test-data'))) {
                    child_process_1.default.execSync('rm -rf ' + path.join(app.testDirectory, 'test-data', '*'));
                }
                if (!fs.existsSync(path.join(app.testDirectory, 'test-data'))) {
                    fs.mkdirSync(path.join(app.testDirectory, 'test-data'));
                }
                fs.cpSync(app.importExportDirectory, path.join(app.testDirectory, 'test-data'), { recursive: true });
                fs.writeFileSync(path.join(app.testDirectory, 'test-data', 'do_import'), '');
                return Promise.resolve();
            })
                .catch(() => { });
        });
    }
    /**
     * Asks the user for consent to stop all containers
     */
    askForConsent(context, acceptDefaults = false) {
        // Non-interactive: proceed with the import/export.
        if (acceptDefaults) {
            return Promise.resolve(true);
        }
        return new Promise((resolve) => {
            inquirer_1.default.prompt({
                name: 'ok',
                type: 'confirm',
                message: this._consentMessage.replace(/%s/g, context.rootDirectory)
            }).then((answers) => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.ok) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
}
exports.AbstractImportExportCommand = AbstractImportExportCommand;
//# sourceMappingURL=AbstractImportExportCommand.js.map