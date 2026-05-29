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
 * Last modified: 2020.04.03 at 18:59
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
exports.AppContext = void 0;
const radashi_1 = require("radashi");
const path = __importStar(require("path"));
class AppContext {
    /**
     * AppContext constructor
     * @param program
     * @param version
     * @param eventEmitter
     * @param platform
     * @param fileFinder
     * @param registry
     * @param appRegistry
     * @param configLoader
     * @param commandRegistry
     */
    constructor(program, version, eventEmitter, platform, fileFinder, registry, appRegistry, configLoader, commandRegistry) {
        this._version = version;
        this._program = program;
        this._eventEmitter = eventEmitter;
        this._cliDirectory = path.join(__dirname, '../../../');
        this._platform = platform;
        this._rootDirectory = fileFinder.findRootDirectory(this);
        this._config = configLoader.load(this);
        this._registry = registry.initialize(this);
        this._appRegistry = appRegistry.initialize(registry, this);
        this._fileFinder = fileFinder;
        this._commandRegistry = commandRegistry;
    }
    /**
     * Returns the current version of the application
     */
    get version() {
        return this._version;
    }
    /**
     * Returns the commander program instance
     */
    get program() {
        return this._program;
    }
    /**
     * Returns the event emitter instance
     */
    get eventEmitter() {
        return this._eventEmitter;
    }
    /**
     * Returns the directory the script was called in
     */
    get cwd() {
        return process.cwd().replace(/[\\\/\s]+$/, path.sep) + path.sep;
    }
    /**
     * True if the current invocation should produce machine-readable output only
     */
    get isMachineReadableOutput() {
        return process.argv.indexOf('--json') !== -1;
    }
    /**
     * Returns the root directory of the cli package
     */
    get cliDirectory() {
        return this._cliDirectory;
    }
    /**
     * Returns the root directory we use as a starting point when looking up other files and directories
     */
    get rootDirectory() {
        return this._rootDirectory;
    }
    /**
     * Returns the local platform information repository
     */
    get platform() {
        return this._platform;
    }
    /**
     * Returns the gathered configuration for the current context
     */
    get config() {
        return this._config;
    }
    /**
     * Returns the command registry to register the commands on
     */
    get commandRegistry() {
        return this._commandRegistry;
    }
    /**
     * Returns the GLOBAL registry to persist data on a key value basis
     */
    get registry() {
        return this._registry;
    }
    /**
     * Returns the app registry instance to persist data on a key value basis for the current app
     */
    get appRegistry() {
        return this._appRegistry;
    }
    /**
     * Returns a lookup tool to find common files and directories
     */
    get fileFinder() {
        return this._fileFinder;
    }
    /**
     * Helper to emit a hook sequentially
     * @param hookName The name of the hook to execute
     * @param args Additional args to pass to the hook
     */
    emitSequentialHook(hookName, args) {
        if (!(0, radashi_1.isObject)(args)) {
            args = {};
        }
        args.context = this;
        return this.eventEmitter.emitHook(hookName, args).then(() => this);
    }
}
exports.AppContext = AppContext;
//# sourceMappingURL=AppContext.js.map