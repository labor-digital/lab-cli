"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRegistry = void 0;
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
 * Last modified: 2020.04.05 at 14:36
 */
const GenericStorage_1 = require("./GenericStorage");
class AppRegistry extends GenericStorage_1.GenericStorage {
    /**
     * Initializes the registry object
     * @param registry
     * @param context
     */
    initialize(registry, context) {
        this._registry = registry;
        this._appId = 'app:' + context.rootDirectory;
        return this;
    }
    /**
     * @inheritDoc
     */
    get(key, fallback) {
        this.storage = this.getProjectStorage();
        return super.get(key, fallback);
    }
    /**
     * @inheritDoc
     */
    set(key, value) {
        this.storage = this.getProjectStorage();
        super.set(key, value);
        this._registry.set(this._appId, this.storage);
        return this;
    }
    /**
     * @inheritDoc
     */
    has(key) {
        this.storage = this.getProjectStorage();
        return super.has(key);
    }
    /**
     * @inheritDoc
     */
    remove(key) {
        this.storage = this.getProjectStorage();
        super.remove(key);
        return this;
    }
    /**
     * @inheritDoc
     */
    forEach(callback) {
        this.storage = this.getProjectStorage();
        super.forEach(callback);
    }
    /**
     * Loads the app storage from the global registry
     */
    getProjectStorage() {
        return this._registry.get(this._appId, {});
    }
}
exports.AppRegistry = AppRegistry;
//# sourceMappingURL=AppRegistry.js.map