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
exports.Platform = void 0;
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
 * Last modified: 2020.04.03 at 20:08
 */
const child_process_1 = __importDefault(require("child_process"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
class Platform {
    /**
     * Platform constructor
     */
    constructor() {
        this._platform = os.platform().toUpperCase();
    }
    /**
     * Returns the name of the currently used platform
     */
    get platform() {
        return this._platform;
    }
    ;
    /**
     * Returns true if the current operating system is windows
     */
    get isWindows() {
        return this._platform === 'WIN32';
    }
    /**
     * Returns true if the current operating system is linux
     */
    get isLinux() {
        return this._platform === 'LINUX';
    }
    ;
    /**
     * Returns true if the current operating system is darwin / OSX
     */
    get isDarwin() {
        return this._platform === 'DARWIN';
    }
    /**
     * Chooses one of the given values/callbacks for the current operating system.
     *
     * @param definition
     * @param useLinuxAsDarwinFallback Set to false to disable automatic fallback of OSX (darwin)
     * definitions to Linux definitions if not explicitly set
     * @return Function
     */
    choose(definition, useLinuxAsDarwinFallback) {
        if (this.isWindows && typeof definition.windows !== 'undefined') {
            return definition.windows;
        }
        else if (this.isDarwin && typeof definition.darwin !== 'undefined') {
            return definition.darwin;
        }
        else if (useLinuxAsDarwinFallback !== false && this.isDarwin && typeof definition.linux !== 'undefined') {
            return definition.linux;
        }
        else if (this.isLinux && typeof definition.linux !== 'undefined') {
            return definition.linux;
        }
        throw new Error('Function definition missing for platform: ' + this._platform);
    }
    /**
     * Checks if a given command platform definition is supported by the current platform specification
     * @param definition
     */
    isCommandSupported(definition) {
        if (this.isWindows && definition.windows) {
            return true;
        }
        if (this.isLinux && definition.linux) {
            return true;
        }
        return this.isDarwin && definition.darwin;
    }
    /**
     * Returns the absolute path to the user home directory with a tailing slash
     */
    get homeDirectory() {
        return os.homedir() + path.sep;
    }
    /**
     * Returns the absolute path to the temporary directory with a tailing slash
     */
    get tempDirectory() {
        return os.tmpdir() + path.sep;
    }
    /**
     * Returns true if the operating system supports 64bit scripts
     */
    is64Bit() {
        return os.arch() === 'x64';
    }
    /**
     * Returns the machines hostname
     * We do need this if we want to identify the running machine in some API-context (like doppler)
     */
    hostname() {
        return os.hostname();
    }
    defaultFileOwner() {
        let defaultFileOwner = child_process_1.default.execSync("echo $LAB_CLI_DEFAULT_OWNER").toString('utf8').trim();
        if (!defaultFileOwner) {
            return null;
        }
        return defaultFileOwner;
    }
}
exports.Platform = Platform;
//# sourceMappingURL=Platform.js.map