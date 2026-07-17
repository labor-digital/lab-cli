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
 * Last modified: 2020.04.03 at 19:43
 */

import * as radashi from 'radashi';
import { get as getPath, get, isObject as isPlainObject, assign as merge } from 'radashi';
type ListPath = string | string[];
import {PlainObject} from '../Utils/ForEachHelper';



export class Config
{
    
    /**
     * The configuration object
     */
    protected config: PlainObject;
    
    /**
     * Config constructor
     * @param config The raw configuration object
     */
    constructor(config: PlainObject)
    {
        this.config = config;
    }
    
    /**
     * Returns true if the given config key exists, false if not
     * @param key
     */
    public has(key: ListPath): boolean
    {
        return (radashi.get(this.config, Array.isArray(key) ? key.join('.') : key) !== undefined);
    }
    
    /**
     * Returns the required configuration based on the given key
     * @param key
     * @param fallback
     */
    public get(key: ListPath, fallback?: any): any
    {
        return getPath(this.config, Array.isArray(key) ? key.join('.') : key, fallback);
    }
    
    /**
     * Used to extend the current configuration with additional options.
     * @param mergeConfig The configuration to merge into the current config object
     */
    public extend(mergeConfig: PlainObject): Config
    {
        if (!isPlainObject(mergeConfig)) {
            throw new Error('The given config is not a plain object!');
        }
        this.config = merge(this.config, mergeConfig);
        return this;
    }
}