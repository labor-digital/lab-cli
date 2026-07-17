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
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnlockCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Unlock_1 = require("../Api/Unlock");
class UnlockCommand {
    /**
     * "lab unlock" - installs a scoped, passwordless sudo rule so lab can run its
     * privileged setup (macOS loopback alias, hosts-file write) without prompting
     * for a password. Useful for CI and AI agents that cannot answer the prompt.
     */
    execute(cmd, context) {
        const unlock = new Unlock_1.Unlock(context);
        if (!unlock.isSupported()) {
            console.log(chalk_1.default.yellowBright('On Windows lab uses a UAC prompt for its privileged steps and cannot be pre-authorized this way.\n' +
                'To avoid repeated prompts, run your terminal "as Administrator". "lab unlock" is macOS & Linux only.'));
            return Promise.resolve();
        }
        if (unlock.isInstalled()) {
            console.log('lab is already unlocked. Run "lab lock" to revert.');
            return Promise.resolve();
        }
        console.log('This grants passwordless sudo for ONLY lab\'s privileged helper (' +
            'loopback alias + hosts file), so lab can run non-interactively.');
        console.log('You will be asked for your password once to install it. Revert any time with "lab lock".');
        unlock.install();
        console.log(chalk_1.default.greenBright('lab is now unlocked - its privileged setup will no longer prompt for a password.'));
        return Promise.resolve();
    }
    /**
     * "lab lock" - removes what "lab unlock" installed.
     */
    lock(cmd, context) {
        const unlock = new Unlock_1.Unlock(context);
        if (!unlock.isSupported()) {
            console.log(chalk_1.default.yellowBright('"lab lock" is macOS & Linux only - there is nothing to remove on Windows.'));
            return Promise.resolve();
        }
        if (!unlock.isInstalled()) {
            console.log('lab is not unlocked - nothing to do.');
            return Promise.resolve();
        }
        console.log('Removing the passwordless sudo rule and helper. You may be asked for your password once.');
        unlock.remove();
        console.log(chalk_1.default.greenBright('lab is locked again - privileged steps will prompt for a password as before.'));
        return Promise.resolve();
    }
}
exports.UnlockCommand = UnlockCommand;
//# sourceMappingURL=UnlockCommand.js.map