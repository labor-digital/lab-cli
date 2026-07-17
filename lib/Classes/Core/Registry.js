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
 * Last modified: 2020.04.04 at 20:40
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
exports.Registry = void 0;
const radashi_1 = require("radashi");
const GenericStorage_1 = require("./GenericStorage");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Registry extends GenericStorage_1.GenericStorage {
    /**
     * @inheritDoc
     */
    set(key, value) {
        this.loadStorageFromFile();
        super.set(key, value);
        const json = JSON.stringify(this.storage);
        fs.writeFileSync(this._storageFile, json);
        return this;
    }
    /**
     * Initializes the registry object by loading the stored data of the json file
     * @param context
     */
    initialize(context) {
        this._storageFile = path.join(context.platform.homeDirectory, 'lab.registry.json');
        this.loadStorageFromFile();
        return this;
    }
    /**
     * Loads the storage data from the registered storage file and rests it
     */
    loadStorageFromFile() {
        let data = {};
        if (fs.existsSync(this._storageFile)) {
            try {
                const content = fs.readFileSync(this._storageFile).toString('utf-8');
                this.storage = JSON.parse(content);
                return;
            }
            catch (e) {
            }
        }
        if ((0, radashi_1.isEmpty)(this.storage)) {
            this.storage = data;
        }
    }
}
exports.Registry = Registry;
//# sourceMappingURL=Registry.js.map