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
 * Last modified: 2020.04.06 at 15:05
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
exports.Unison = void 0;
const radashi_1 = require("radashi");
const chalk_1 = __importDefault(require("chalk"));
const childProcess = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Unison {
    /**
     * Starts the unison sync for a given docker app
     * @param app The docker app to run unison for
     * @param force True to force unison to run without archives
     */
    static startUnison(app, force) {
        return new Promise((resolve, reject) => {
            // Prepare options
            const additionalArgs = app.context.config.get('unison.additionalArgs', '').trim();
            const allowNodeModules = app.context.config.get('unison.allowNodeModules', false);
            const targetPort = app.context.config.get('unison.target.port', 5000);
            const targetIp = app.context.config.get('unison.target.ip', app.env.get('APP_IP'));
            let hostPath = app.context.config.get('unison.host.directory');
            if (!(0, radashi_1.isString)(hostPath)) {
                if (fs.existsSync(path.join(app.context.rootDirectory, 'src'))) {
                    hostPath = path.join(app.context.rootDirectory, 'src');
                }
                else {
                    hostPath = app.context.rootDirectory;
                }
            }
            // Build the command
            const command = '"' + Unison.getUnisonExecutable(app) + '" "' + hostPath + '" ' +
                '"socket://' + targetIp + ':' + targetPort + '" ' +
                '-repeat watch ' +
                (allowNodeModules ? '' : '-ignore "Name node_modules" ') +
                '-ignore "Name *.dev-symlink-bkp" ' +
                '-ignore "Name perms.set" ' +
                '-prefer "' + hostPath + '" ' +
                '-ignorecase false ' +
                '-auto ' +
                '-ui text ' +
                '-links false ' +
                '-label "APP: ' + app.context.rootDirectory.replace(/\\/g, '/') + '" ' +
                (force ? '-ignorearchives -ignorelocks ' : '') +
                ' ' + additionalArgs;
            console.log(command);
            try {
                childProcess.execSync(command, { stdio: 'inherit' });
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Returns the absolute path to the unison executable
     * @param app
     */
    static getUnisonExecutable(app) {
        return app.context.platform.choose({
            windows: () => path.join(app.context.cliDirectory, 'bin/unison/unison 2.48.4 text.exe'),
            darwin: () => {
                function isUnisonRegisteredAsCliTool() {
                    try {
                        return childProcess.execSync('which unison').toString('utf-8').indexOf('unison') !== -1
                            && childProcess.execSync('which unison-fsmonitor').toString('utf-8')
                                .indexOf('unison-fsmonitor') !== -1;
                    }
                    catch (e) {
                        return false;
                    }
                }
                if (isUnisonRegisteredAsCliTool()) {
                    return '/usr/local/bin/unison';
                }
                console.log(chalk_1.default.yellowBright('Unison is currently not installed as command line utility. You have to install it using the GUI. If it does not ask you to install the CLI utility click on: "Unison" -> "Install Command line tool". Close the GUI after you are done, in order to continue.'));
                console.log('Unison will start in 3 seconds');
                const unisonGuiExecutable = path.join(app.context.cliDirectory, 'bin/unison/darwin/Unison.app/Contents/MacOS/cltool');
                childProcess.execSync('sleep 3 && "' + unisonGuiExecutable + '"', { stdio: 'inherit' });
                console.log(chalk_1.default.yellowBright('Installing fs-monitor into /user/local/bin, this requires root privileges.'));
                const fsMonitorExecutable = path.join(app.context.cliDirectory, 'bin/unison/darwin/unison-fsmonitor');
                childProcess.execSync('sudo cp "' + fsMonitorExecutable + '" /usr/local/bin && chmod +x /usr/local/bin/unison-fsmonitor');
                if (isUnisonRegisteredAsCliTool()) {
                    return '/usr/local/bin/unison';
                }
                throw new Error('Unison was not set up correctly!');
            }
        })();
    }
}
exports.Unison = Unison;
//# sourceMappingURL=Unison.js.map