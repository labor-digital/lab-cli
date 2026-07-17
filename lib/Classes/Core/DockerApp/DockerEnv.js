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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerEnv = void 0;
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
 * Last modified: 2020.04.05 at 22:05
 */
const radashi_1 = require("radashi");
const fs = __importStar(require("fs"));
class DockerEnv {
    constructor(filename) {
        this._filename = filename;
        this.read();
    }
    /**
     * Returns all registered env configuration as an object
     */
    getAll() {
        return Object.fromEntries(this._env);
    }
    /**
     * Returns the value of the value of a single env key or undefined if the key does not exist
     * @param key the key to look up from the .env file
     * @param defaultValue A default value to return if the key was not found
     */
    get(key, defaultValue) {
        if (!this.has(key)) {
            return defaultValue;
        }
        return this._env.get(key);
    }
    /**
     * Updates the .env file by setting a new key to a given value
     * @param key The key to update in the .env file
     * @param value The value to set for the key
     */
    set(key, value) {
        if (this._env.get(key) === value) {
            return;
        }
        this.read();
        this._env.set(key, value);
        this.write();
        return this;
    }
    /**
     * Returns true if the given key was found inside the .env file and the value was not empty
     * @param key
     */
    has(key) {
        return this._env.has(key);
    }
    /**
     * Returns the template string for this .env file
     */
    get tpl() {
        return this._tpl;
    }
    /**
     * Reads the contents of the .env file into the memory
     */
    read() {
        if (!fs.existsSync(this._filename)) {
            throw new Error('Could not find a .env file at: ' + this._filename);
        }
        const lines = fs.readFileSync(this._filename).toString('utf-8').split(/\r?\n/);
        const tpl = [];
        const env = new Map();
        // Iterate the lines
        lines.forEach(line => {
            let lineWork = line.trim();
            // Skip comments and empty lines
            if (lineWork.length === 0 || lineWork.charAt(0) === '#' || lineWork.indexOf('=') === -1) {
                tpl.push(lineWork);
                return;
            }
            // Extract key value and store the line in the template
            tpl.push(lineWork.replace(/^([^=]*?)(?:\s+)?=(?:\s+)?(.*?)(\s#|$)/, (a, key, value, comment) => {
                // Prepare value
                value = value.trim();
                if (value.length === 0) {
                    value = null;
                }
                // Handle comment only value
                if ((0, radashi_1.isString)(value) && value.charAt(0) === '#') {
                    comment = ' ' + value;
                    value = null;
                }
                key = key.trim();
                if (env.has(key)) {
                    throw new Error('Invalid .env file! There was a duplicate key: ' + key);
                }
                env.set(key.trim(), value);
                return '{{pair}}' + (!(0, radashi_1.isEmpty)(comment) ? comment : '');
            }));
        });
        // Store the data
        this._tpl = tpl.join('\n');
        this._env = env;
    }
    /**
     * Writes the current env data to the disc
     */
    write(removeDefaultOwner = false) {
        // Build the content based on the template and the current storage
        const keys = Array.from(this._env.keys());
        let contents = this._tpl.replace(/{{pair}}/g, () => {
            const key = keys.shift();
            const value = this._env.get(key);
            if (removeDefaultOwner && key === 'DEFAULT_OWNER') {
                return '_DELETE_';
            }
            if (key === 'PROJECT_DEV_TEST' && value === 'no') {
                return '_DELETE_';
            }
            return key + '=' + value;
        }).replace('_DELETE_\n', '').replace('\n_DELETE_', '');
        if (keys.length > 0) {
            (0, ForEachHelper_1.forEach)(keys, (key) => {
                const value = this._env.get(key);
                if (!removeDefaultOwner || key !== 'DEFAULT_OWNER') {
                    contents += '\n' + key + '=' + value;
                }
            });
        }
        // Remove all spacing at the top and bottom of the file
        contents = contents.replace(/^\s+|\s+$/g, '');
        // Write the file
        fs.writeFileSync(this._filename, contents);
    }
}
exports.DockerEnv = DockerEnv;
//# sourceMappingURL=DockerEnv.js.map