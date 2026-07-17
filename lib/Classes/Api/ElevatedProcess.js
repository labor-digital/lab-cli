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
 * Last modified: 2020.04.05 at 19:34
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
exports.ElevatedProcess = void 0;
const childProcess = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ElevatedProcess {
    /**
     * Elevated Process constructor
     * @param context
     */
    constructor(context) {
        this._context = context;
    }
    /**
     * Executes a single command as an elevated process
     * @param cmd A valid command to be executed
     * @param keepOpen True to keep the window open after it executed -> Windows only
     * @returns {*}
     */
    exec(cmd, keepOpen) {
        return this._context.platform.choose({
            windows: () => {
                var elevatePath = this.getWindowsExecutablePath();
                const quoteCommand = cmd.indexOf('"') === -1;
                if (quoteCommand) {
                    cmd = '"' + cmd + '"';
                }
                let options = '-w ' + (keepOpen ? '-k' : '-c');
                var command = '"' + elevatePath + '" ' + options + ' ' + cmd;
                return childProcess.execSync(command, { 'stdio': 'inherit' });
            },
            linux: () => {
                const command = 'sudo ' + cmd;
                return childProcess.execSync(command, { 'stdio': 'inherit' });
            }
        })();
    }
    /**
     * Executes multiple commands as single elevated process
     * @param cmdList And array of commands to be executed in their given order
     */
    execMultiple(cmdList) {
        // Check if the list is an array
        if (typeof cmdList.forEach !== 'function') {
            throw new Error('The command list has to be an array');
        }
        // Build the bat file
        var content = (Array.isArray(cmdList) ? cmdList : [cmdList]).join('\n');
        // Write the content
        const executionFile = this._context.platform.choose({
            windows: () => this._context.platform.tempDirectory + '\\elevatedMultiCommand.bat',
            linux: () => {
                // Add shebang to content
                content = '#!/bin/sh\n' + content;
                return this._context.platform.tempDirectory + '/elevatedMultiCommand.sh';
            }
        })();
        fs.writeFileSync(executionFile, content);
        // Make sure the file has the correct permissions
        this._context.platform.choose({
            windows: () => {
            },
            linux: () => {
                fs.chmodSync(executionFile, 0o777);
            }
        })();
        // Execute the bat
        this.exec(executionFile);
        // Remove the bat again
        fs.unlinkSync(executionFile);
    }
    /**
     * Returns the absolute file path to the windows elevator script
     */
    getWindowsExecutablePath() {
        return path.join(__dirname, '../../../', 'bin/elevate/bin.x86-' +
            (this._context.platform.is64Bit() ? '64' : '32') + '/elevate.exe');
    }
}
exports.ElevatedProcess = ElevatedProcess;
//# sourceMappingURL=ElevatedProcess.js.map