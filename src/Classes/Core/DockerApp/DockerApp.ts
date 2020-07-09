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
 * Last modified: 2020.04.05 at 16:05
 */

import {PlainObject} from '@labor-digital/helferlein/lib/Interfaces/PlainObject';
import {forEach} from '@labor-digital/helferlein/lib/Lists/forEach';
import {md5} from '@labor-digital/helferlein/lib/Misc/md5';
import {isEmpty} from '@labor-digital/helferlein/lib/Types/isEmpty';
import {isString} from '@labor-digital/helferlein/lib/Types/isString';
import {isUndefined} from '@labor-digital/helferlein/lib/Types/isUndefined';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as path from 'path';
import {Docker} from '../../Api/Docker';
import {DockerCompose} from '../../Api/DockerCompose';
import {AppContext} from '../AppContext';
import {Bugfixes} from '../Bugfixes';
import {DockerAppInit} from './DockerAppInit';
import {DockerEnv} from './DockerEnv';

export class DockerApp
{
    
    public static dockerComposeRootFiles = [
        'docker-compose.dev.yml',
        'docker-compose.yml'
    ];
    
    public static dockerComposeOverrideFiles = [
        'docker-compose.dev.override.yml',
        'docker-compose.override.yml'
    ];
    
    public static dockerConfigFiles = [
        ...DockerApp.dockerComposeOverrideFiles,
        '.env'
    ];
    
    /**
     * The docker api instance to perform actions
     */
    protected _api: Docker;
    
    /**
     * The docker compose api instance
     */
    protected _dockerCompose: DockerCompose;
    
    /**
     * The context object for this docker application
     */
    protected _context: AppContext;
    
    /**
     * Holds the path of the main docker-compose file
     */
    protected _dockerComposeFile: string;
    
    /**
     * Holds the path to the docker-compose override file or is undefined if there is none
     */
    protected _dockerComposeOverrideFile: string | undefined;
    
    /**
     * The environment config for the docker app
     */
    protected _env: DockerEnv;
    
    public constructor(context: AppContext)
    {
        this._context = context;
        this._api = new Docker(context);
        this._dockerCompose = new DockerCompose(this);
    }
    
    /**
     * Returns the environment config for the docker app
     */
    public get env(): DockerEnv
    {
        return this._env;
    }
    
    /**
     * Updates the environment config for the docker app
     * @param env
     */
    public set env(env: DockerEnv)
    {
        this._env = env;
    }
    
    /**
     * Returns the main docker-compose file path
     */
    public get dockerComposeFile(): string | undefined
    {
        if (this._dockerComposeFile === '-1') {
            return undefined;
        }
        forEach(DockerApp.dockerComposeRootFiles, (filename: string) => {
            filename = path.join(this._context.rootDirectory, filename);
            if (!fs.existsSync(filename)) {
                return;
            }
            this._dockerComposeFile = filename;
        });
        if (!isUndefined(this._dockerComposeFile)) {
            return this._dockerComposeFile;
        }
        this._dockerComposeFile = '-1';
        return undefined;
    }
    
    /**
     * Returns the path to the docker compose override file
     */
    public get dockerComposeOverrideFile(): string | undefined
    {
        if (this._dockerComposeOverrideFile === '-1') {
            return undefined;
        }
        forEach(DockerApp.dockerComposeOverrideFiles, (filename: string) => {
            filename = path.join(this._context.rootDirectory, filename);
            if (!fs.existsSync(filename)) {
                return;
            }
            this._dockerComposeOverrideFile = filename;
        });
        if (!isUndefined(this._dockerComposeOverrideFile)) {
            return this._dockerComposeOverrideFile;
        }
        this._dockerComposeOverrideFile = '-1';
        return undefined;
    }
    
    /**
     * Returns the path to the import / export directory
     */
    public get importExportDirectory(): string
    {
        let importDir = this.env.get('APP_IMPORT_DIR');
        if (isString(importDir)) {
            return importDir;
        }
        return path.join(this._context.rootDirectory, 'import');
    }
    
    /**
     * Returns the instance of the docker api
     */
    public get docker(): Docker
    {
        return this._api;
    }
    
    /**
     * Returns the context instance for this app
     */
    public get context(): AppContext
    {
        return this._context;
    }
    
    /**
     * Returns the instance of the docker compose api
     */
    public get dockerCompose(): DockerCompose
    {
        return this._dockerCompose;
    }
    
    /**
     * Returns the container name, resolved via the configuration or by resolving to the default container name
     */
    public get containerName(): string
    {
        // Find the container name by the configured service key
        const serviceKey = this._context.config.get('docker.serviceKey');
        if (!isUndefined(serviceKey)) {
            let containerName = undefined;
            const services = this.dockerCompose.getServiceList();
            forEach(services, (service: PlainObject) => {
                if (service.key !== serviceKey) {
                    return;
                }
                containerName = service.containerName;
                return false;
            });
            if (isString(containerName)) {
                return containerName;
            }
        }
        
        // Find the container by direct configuration
        if (this._context.config.has('docker.containerName')) {
            return this._context.config.get('docker.containerName');
        }
        
        // Return the default container name
        return this._context.appRegistry.get('defaultServiceContainer');
    }
    
    /**
     * Returns the main docker compose service key for the current container
     */
    public get serviceKey(): string
    {
        // Check if the key was configured
        let serviceKey = this._context.config.get('docker.serviceKey');
        if (!isUndefined(serviceKey)) {
            return serviceKey;
        }
        
        // Find the service by the container name
        const containerName = this.containerName;
        const services = this.dockerCompose.getServiceList();
        forEach(services, (service: PlainObject) => {
            if (service.containerName !== containerName) {
                return;
            }
            serviceKey = service.key;
            return false;
        });
        if (!isString(serviceKey)) {
            return 'app';
        }
        return serviceKey;
    }
    
    /**
     * Checks if the stored docker configuration for the current app is up to date or runs the init process
     */
    public initialize(): Promise<DockerApp>
    {
        
        // Check if we have docker files
        if (!this.hasDockerFiles()) {
            return Promise.reject(new Error('There are no docker-compose files in the directory: "' +
                                            this._context.rootDirectory + '\!'));
        }
        
        // Check if docker is running
        if (!this._api.isInstalled) {
            return Promise.reject(new Error('It seems like docker is currently not installed on your system!'));
        }
        
        // Check if docker is running
        return this.startDockerIfRequired().then(() => {
            
            // Check if we have a config
            const config = this._context.appRegistry.get('dockerApp', {});
            if (isEmpty(config)) {
                return this.runInit();
            }
            
            // Check if we have a change in the docker files
            if (config.hash !== this.calculateDockerFileHash()) {
                return this.runInit();
            }
            
            // Initialize the env
            this._env = new DockerEnv(path.join(this._context.rootDirectory, '.env'));
            
            // Nothing to do
            return Promise.resolve(this);
        });
        
    }
    
    /**
     * Calculates a hash sum for all docker relevant files
     */
    public calculateDockerFileHash(): string
    {
        const rawHash: Array<string> = [];
        forEach([...DockerApp.dockerComposeRootFiles, ...DockerApp.dockerConfigFiles], (file: string) => {
            const filename = path.join(this._context.rootDirectory, file);
            if (!fs.existsSync(filename)) {
                rawHash.push('0');
            } else {
                rawHash.push(md5(fs.readFileSync(filename).toString('utf-8')));
            }
        });
        return md5(rawHash.join(','));
    }
    
    /**
     * Returns true if there are docker related files in the current root directory, false if not
     */
    protected hasDockerFiles(): boolean
    {
        return !isUndefined(this.dockerComposeFile);
    }
    
    /**
     * Checks if the docker engine is currently running.
     * If not it will ask the user to start the engine automatically
     */
    protected startDockerIfRequired(): Promise<void>
    {
        if (this._api.isRunning) {
            return Promise.resolve();
        }
        
        // Ask user
        return inquirer.prompt({
            name: 'startDocker',
            type: 'confirm',
            message: 'The Docker Engine is not running. Should I start it for you?'
        }).then(answers => {
            Bugfixes.inquirerChildProcessReadLineFix();
            if (!answers.startDocker) {
                return Promise.reject(
                    new Error('Sorry, this can\'t be done without docker running!'));
            }
            console.log('Starting docker engine...');
            return this._api.startEngine();
        });
    }
    
    /**
     * Runs the docker app init controller to make sure everything is set up correctly
     */
    protected runInit(): Promise<DockerApp>
    {
        return (new DockerAppInit(this._dockerComposeFile, this._context, this))
            .run()
            .then(() => this);
    }
}