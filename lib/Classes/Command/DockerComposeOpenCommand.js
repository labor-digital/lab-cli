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
 * Last modified: 2020.04.06 at 19:30
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
exports.DockerComposeOpenCommand = void 0;
const childProcess = __importStar(require("child_process"));
const inquirer_1 = __importDefault(require("inquirer"));
const Bugfixes_1 = require("../Core/Bugfixes");
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
class DockerComposeOpenCommand {
    execute(cmd, context, stack) {
        return (new DockerApp_1.DockerApp(context)).initialize().then(app => {
            var _a;
            if (!app.dockerCompose.isRunning) {
                return this.askToStartContainer(context, stack);
            }
            const domain = app.env.get('APP_DOMAIN', app.env.get('APP_IP'));
            const protocol = app.env.get('APP_PROTOCOL', `${(_a = cmd.opts().protocol) !== null && _a !== void 0 ? _a : 'https'}://`);
            const url = protocol + domain;
            console.log('Opening website "' + url + '" in your default browser!');
            const command = context.platform.choose({
                windows: () => {
                    return 'start "" "' + url + '"';
                },
                darwin: () => {
                    return 'open "' + url + '"';
                },
                linux: () => {
                    return 'xdg-open ' + url;
                }
            })();
            childProcess.execSync(command);
        });
    }
    /**
     * Asks the user to start the container
     * @param context
     * @param stack
     */
    askToStartContainer(context, stack) {
        return new Promise((resolve, reject) => {
            inquirer_1.default.prompt({
                name: 'startApp',
                type: 'confirm',
                message: 'Can\'t open your app, because it is currently not running! Should I start it for you?'
            }).then((answers) => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.startApp) {
                    return reject(new Error('The app has to be running before you can open it!'));
                }
                stack.push(['up']);
                stack.push(['open']);
                resolve();
            });
        });
    }
}
exports.DockerComposeOpenCommand = DockerComposeOpenCommand;
//# sourceMappingURL=DockerComposeOpenCommand.js.map