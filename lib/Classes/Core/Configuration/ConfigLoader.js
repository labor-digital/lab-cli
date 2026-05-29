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
exports.ConfigLoader = void 0;
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
 * Last modified: 2020.04.03 at 19:42
 */
const radashi_1 = require("radashi");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Config_1 = require("./Config");
const DefaultConfig_1 = require("./DefaultConfig");
class ConfigLoader {
    /**
     * Factory to create the configuration for the given context
     *
     * @param context
     */
    load(context) {
        // Initialize default config
        let config = DefaultConfig_1.DefaultConfig.make(context);
        // Try to load global config
        const configFileName = 'lab.config.json';
        const globalConfigPath = context.platform.homeDirectory + configFileName;
        config = (0, radashi_1.assign)(config, this.loadConfigFile(globalConfigPath));
        // Load project config
        (0, ForEachHelper_1.forEach)([
            context.rootDirectory + configFileName,
            path.join(context.rootDirectory, '..', configFileName)
        ], (filename) => {
            config = (0, radashi_1.assign)(config, this.loadConfigFile(filename));
        });
        // Load directory config if there is one and we are not in the cwd
        // (as it would have been handled by the project config lookup already)
        if (context.rootDirectory !== context.cwd) {
            const dirConfigPath = context.cwd + configFileName;
            config = (0, radashi_1.assign)(config, this.loadConfigFile(dirConfigPath));
        }
        // Wrap the config into the config object
        return new Config_1.Config(config);
    }
    /**
     * Internal helper to load the content of a given configuration file and return the contents
     * @param filename
     */
    loadConfigFile(filename) {
        if (!fs.existsSync(filename)) {
            return {};
        }
        try {
            const content = fs.readFileSync(filename).toString('utf-8');
            return JSON.parse(content);
        }
        catch (e) {
            console.log(chalk_1.default.redBright('Failed to load config file: ' + filename));
            return {};
        }
    }
}
exports.ConfigLoader = ConfigLoader;
//# sourceMappingURL=ConfigLoader.js.map