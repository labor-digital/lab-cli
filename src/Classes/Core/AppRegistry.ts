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

import {GenericStorage, GenericStorageInterface, PlainObject} from '@labor-digital/helferlein';
import {AppContext} from './AppContext';
import {Registry} from './Registry';

export class AppRegistry extends GenericStorage
{
    
    /**
     * The unique storage id for this app
     */
    protected _appId: string;
    
    /**
     * The registry we use to store our data in
     */
    protected _registry: Registry;
    
    /**
     * Initializes the registry object
     * @param registry
     * @param context
     */
    public initialize(registry: Registry, context: AppContext): AppRegistry
    {
        this._registry = registry;
        this._appId = 'app:' + context.rootDirectory;
        return this;
    }
    
    /**
     * @inheritDoc
     */
    public get(key?: string | number, fallback?: any): any
    {
        this.storage = this.getProjectStorage();
        return super.get(key, fallback);
    }
    
    /**
     * @inheritDoc
     */
    public set(key: string | number, value: any): GenericStorageInterface
    {
        this.storage = this.getProjectStorage();
        super.set(key, value);
        this._registry.set(this._appId, this.storage);
        return this;
    }
    
    /**
     * @inheritDoc
     */
    public has(key: string | number): boolean
    {
        this.storage = this.getProjectStorage();
        return super.has(key);
    }
    
    /**
     * @inheritDoc
     */
    public remove(key: string | number): GenericStorageInterface
    {
        this.storage = this.getProjectStorage();
        super.remove(key);
        return this;
    }
    
    /**
     * @inheritDoc
     */
    public forEach(callback: Function): void
    {
        this.storage = this.getProjectStorage();
        super.forEach(callback);
    }
    
    /**
     * Loads the app storage from the global registry
     */
    protected getProjectStorage(): PlainObject
    {
        return this._registry.get(this._appId, {});
    }
}