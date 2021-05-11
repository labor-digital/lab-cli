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

import {asObject} from '@labor-digital/helferlein/lib/FormatAndConvert/asObject';
import {PlainObject} from '@labor-digital/helferlein/lib/Interfaces/PlainObject';
import {forEach} from '@labor-digital/helferlein/lib/Lists/forEach';
import {getListKeys} from '@labor-digital/helferlein/lib/Lists/listAccess';
import {isEmpty} from '@labor-digital/helferlein/lib/Types/isEmpty';
import {isString} from '@labor-digital/helferlein/lib/Types/isString';
import * as fs from 'fs';

export class DockerEnv
{
    
    /**
     * The absolute path to the environment file
     */
    protected _filename: string;
    
    /**
     * Contains the loaded env data
     */
    protected _env: Map<string, string>;
    
    /**
     * The list of the template lines to re-inject the values when writing the file
     */
    protected _tpl: string;
    
    public constructor(filename: string)
    {
        this._filename = filename;
        this.read();
    }
    
    /**
     * Returns all registered env configuration as an object
     */
    public getAll(): PlainObject
    {
        return asObject(this._env);
    }
    
    /**
     * Returns the value of the value of a single env key or undefined if the key does not exist
     * @param key the key to look up from the .env file
     * @param defaultValue A default value to return if the key was not found
     */
    public get(key: string, defaultValue?: string): string | undefined
    {
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
    public set(key: string, value: string): DockerEnv
    {
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
    public has(key: string): boolean
    {
        return this._env.has(key);
    }
    
    /**
     * Returns the template string for this .env file
     */
    public get tpl(): string
    {
        return this._tpl;
    }
    
    /**
     * Reads the contents of the .env file into the memory
     */
    protected read(): void
    {
        if (!fs.existsSync(this._filename)) {
            throw new Error('Could not find a .env file at: ' + this._filename);
        }
        const lines = fs.readFileSync(this._filename).toString('utf-8').split(/\r?\n/);
        const tpl: Array<string> = [];
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
                if (isString(value) && value.charAt(0) === '#') {
                    comment = ' ' + value;
                    value = null;
                }
                
                key = key.trim();
                if (env.has(key)) {
                    throw new Error('Invalid .env file! There was a duplicate key: ' + key);
                }
                env.set(key.trim(), value);
                return '{{pair}}' + (!isEmpty(comment) ? comment : '');
            }));
        });
        
        // Store the data
        this._tpl = tpl.join('\n');
        this._env = env;
    }
    
    /**
     * Writes the current env data to the disc
     */
    protected write(): void
    {
        // Build the content based on the template and the current storage
        const keys: Array<string> = getListKeys(this._env) as any;
        let contents = this._tpl.replace(/{{pair}}/g, () => {
            const key = keys.shift();
            const value = this._env.get(key);
            return key + '=' + value;
        });
        if (keys.length > 0) {
            forEach(keys, (key: string) => {
                const value = this._env.get(key);
                contents += '\n' + key + '=' + value;
            });
        }
        
        // Remove all spacing at the top and bottom of the file
        contents = contents.replace(/^\s+|\s+$/g, '');
        
        // Write the file
        fs.writeFileSync(this._filename, contents);
    }
}