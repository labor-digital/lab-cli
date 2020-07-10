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

import {EventEmitter} from '@labor-digital/helferlein/lib/Events/EventEmitter';
import {PlainObject} from '@labor-digital/helferlein/lib/Interfaces/PlainObject';
import {isPlainObject} from '@labor-digital/helferlein/lib/Types/isPlainObject';
import commander from 'commander';
import * as path from 'path';
import {Platform} from '../Api/Platform';
import {AppRegistry} from './AppRegistry';
import {CommandRegistry} from './Command/CommandRegistry';
import {Config} from './Configuration/Config';
import {ConfigLoader} from './Configuration/ConfigLoader';
import {FileFinder} from './FileFinder';
import {Registry} from './Registry';

export class AppContext
{
    
    /**
     * The current version of the application
     */
    private _version: string;
    
    /**
     * The commander program instance
     */
    private _program: commander.Command;
    
    /**
     * The event emitter instance
     */
    private _eventEmitter: EventEmitter;
    
    /**
     * The directory the script was called in
     */
    private _cwd: string;
    
    /**
     * The base directory of the cli sources
     */
    private _cliDirectory: string;
    
    /**
     * The root directory we use as a starting point when looking up other files and directories
     */
    private _rootDirectory: string;
    
    /**
     * Local platform information repository
     */
    private _platform: Platform;
    
    /**
     * The gathered configuration for the current context
     */
    private _config: Config;
    
    /**
     * A GLOBAL registry to persist data on a key value basis
     * Note: All data stored in the registry has to be json serializable!
     */
    private _registry: Registry;
    
    /**
     * The app registry instance to persist data on a key value basis for the current app
     * Note: All data stored in the registry has to be json serializable!
     */
    private _appRegistry: AppRegistry;
    
    /**
     * Lookup tool to find common files and directories
     */
    private _fileFinder: FileFinder;
    
    /**
     * Holds the command registry to register the commands on
     */
    private _commandRegistry: CommandRegistry;
    
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
    public constructor(program: commander.Command, version: string, eventEmitter: EventEmitter,
        platform: Platform, fileFinder: FileFinder, registry: Registry, appRegistry: AppRegistry,
        configLoader: ConfigLoader, commandRegistry: CommandRegistry
    )
    {
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
    public get version(): string
    {
        return this._version;
    }
    
    /**
     * Returns the commander program instance
     */
    public get program(): commander.Command
    {
        return this._program;
    }
    
    /**
     * Returns the event emitter instance
     */
    public get eventEmitter(): EventEmitter
    {
        return this._eventEmitter;
    }
    
    /**
     * Returns the directory the script was called in
     */
    public get cwd(): string
    {
        return process.cwd().replace(/[\\\/\s]+$/, path.sep) + path.sep;
    }
    
    /**
     * Returns the root directory of the cli package
     */
    public get cliDirectory(): string
    {
        return this._cliDirectory;
    }
    
    /**
     * Returns the root directory we use as a starting point when looking up other files and directories
     */
    public get rootDirectory(): string
    {
        return this._rootDirectory;
    }
    
    /**
     * Returns the local platform information repository
     */
    public get platform(): Platform
    {
        return this._platform;
    }
    
    /**
     * Returns the gathered configuration for the current context
     */
    public get config(): Config
    {
        return this._config;
    }
    
    /**
     * Returns the command registry to register the commands on
     */
    public get commandRegistry(): CommandRegistry
    {
        return this._commandRegistry;
    }
    
    /**
     * Returns the GLOBAL registry to persist data on a key value basis
     */
    public get registry(): Registry
    {
        return this._registry;
    }
    
    /**
     * Returns the app registry instance to persist data on a key value basis for the current app
     */
    public get appRegistry(): AppRegistry
    {
        return this._appRegistry;
    }
    
    /**
     * Returns a lookup tool to find common files and directories
     */
    public get fileFinder(): FileFinder
    {
        return this._fileFinder;
    }
    
    /**
     * Helper to emit a hook sequentially
     * @param hookName The name of the hook to execute
     * @param args Additional args to pass to the hook
     */
    public emitSequentialHook(hookName: string, args?: PlainObject): Promise<AppContext>
    {
        if (!isPlainObject(args)) {
            args = {};
        }
        args.context = this;
        return this.eventEmitter.emitHook(hookName, args).then(() => this);
    }
}