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
 * Last modified: 2020.04.05 at 21:46
 */

import {forEach, isString, md5} from '@labor-digital/helferlein';
import {mkdirRecursiveSync} from '@labor-digital/helferlein/node';
import chalk from 'chalk';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as path from 'path';
import {Ip} from '../../Api/Ip';
import {AppContext} from '../AppContext';
import {AppEventList} from '../AppEventList';
import {Bugfixes} from '../Bugfixes';
import {DockerComposeServiceSelectWizard} from '../Ui/DockerComposeServiceSelectWizard';
import {ProjectNameInputWizard} from '../Ui/ProjectNameInputWizard';
import {DockerApp} from './DockerApp';
import {DockerEnv} from './DockerEnv';
import {DockerEnvTemplate} from './DockerEnvTemplate';
import {DockerHosts} from './DockerHosts';

export class DockerAppInit
{
    
    /**
     * The absolute path to the main docker compose file
     */
    protected _dockerComposeFile: string;
    
    /**
     * The context to start the docker-compose command with
     */
    protected _context: AppContext;
    
    /**
     * The app that requested the initialization
     */
    protected _app: DockerApp;
    
    /**
     * DockerAppInit Constructor
     *
     * @param dockerComposeFile
     * @param context
     * @param app
     */
    public constructor(dockerComposeFile: string, context: AppContext, app: DockerApp)
    {
        this._dockerComposeFile = dockerComposeFile;
        this._context = context;
        this._app = app;
    }
    
    /**
     * Main controller to initialize a docker application
     */
    public run(): Promise<void>
    {
        console.log('Found changes on your docker app files! Checking your setup...');
        
        return Promise.resolve()
                      .then(() => this._context.emitSequentialHook(
                          AppEventList.DOCKER_APP_BEFORE_INIT, {app: this._app}))
                      .then(() => this.clearCachedValues())
                      .then(() => this.makeSureEnvFileExists('.env'))
                      .then(() => this.makeSureEnvFileExists('.env.app'))
                      .then(() => this._context.emitSequentialHook(
                          AppEventList.DOCKER_APP_AFTER_ENV_FILE_CHECK, {app: this._app}))
                      .then(() => this.fillEmptyValuesInEnvFile())
                      .then(() => this.generateEnvTemplateFile('.env'))
                      .then(() => this.generateEnvTemplateFile('.env.app'))
                      .then(() => this._context.emitSequentialHook(
                          AppEventList.DOCKER_APP_AFTER_ENV_INIT, {app: this._app}))
                      .then(() => this.registerDomainInHostsFile())
                      .then(() => this._context.emitSequentialHook(
                          AppEventList.DOCKER_APP_AFTER_HOST_FILE_UPDATE, {app: this._app}))
                      .then(() => this.createRegisteredDirectories())
                      .then(() => this._context.emitSequentialHook(
                          AppEventList.DOCKER_APP_AFTER_DIRECTORIES, {app: this._app}))
                      .then(() => this.selectDefaultService())
                      .then(() => this._context.emitSequentialHook(
                          AppEventList.DOCKER_APP_AFTER_DEFAULT_SERVICE, {app: this._app}))
                      .then(() => this.writeDockerAppConfig())
                      .then(() => this._context.emitSequentialHook(
                          AppEventList.DOCKER_APP_INIT_DONE, {app: this._app}))
                      .then(() => {
                      });
    }
    
    /**
     * Removes some cached values from the app registry
     */
    protected clearCachedValues(): Promise<void>
    {
        this._context.appRegistry.remove('serviceList');
        return Promise.resolve();
    }
    
    /**
     * Makes sure that the .env file exists right beside the docker-compose file
     */
    protected makeSureEnvFileExists(filename: string): Promise<void>
    {
        const envFilePath = path.join(this._context.rootDirectory, filename);
        if (fs.existsSync(envFilePath)) {
            return Promise.resolve();
        }
        
        const envTemplateFilePath = path.join(this._context.rootDirectory, filename + '.template');
        if (fs.existsSync(envTemplateFilePath)) {
            fs.copyFileSync(envTemplateFilePath, envFilePath);
            return Promise.resolve();
        }
        fs.writeFileSync(envFilePath, '');
        return Promise.resolve();
    }
    
    /**
     * Parses the .env file of the docker app and fills empty values with automatically generated defaults
     */
    protected fillEmptyValuesInEnvFile(): Promise<void>
    {
        
        // Load the env
        const envFilePath = path.join(this._context.rootDirectory, '.env');
        const env = new DockerEnv(envFilePath);
        this._app.env = env;
        
        function isValueEmpty(key: string): boolean
        {
            return !env.has(key) || !isString(env.get(key)) ||
                   env.get(key).trim() === 'null' ||
                   env.get(key).trim().charAt(0) === '§';
        }
        
        function setValueIfEmpty(key: string, value: string)
        {
            if (isValueEmpty(key)) {
                env.set(key, value);
            }
        }
        
        function setValueIfKeyExistsAndEmpty(key: string, value: string)
        {
            if (env.has(key) && isValueEmpty(key)) {
                env.set(key, value);
            }
        }
        
        // Make sure we have the COMPOSE_PROJECT_NAME variable
        return (
            isValueEmpty('COMPOSE_PROJECT_NAME') ? () => ProjectNameInputWizard.run(
                'Your .env file does not contain a: "COMPOSE_PROJECT_NAME" parameter. Define the name of the project based on the following options:',
                this._context
            ).then((name: string) => {
                env.set('COMPOSE_PROJECT_NAME', name);
                return name;
            }) : () => Promise.resolve(env.get('COMPOSE_PROJECT_NAME'))
        )()
            .then((projectName: string) => {
                const projectShortName = projectName
                    .trim()
                    .split('-')
                    .map(v => v.replace(/_/, '').trim().substr(0, 3))
                    .join('_')
                    .toLowerCase();
                
                // Prepare the app base directory
                const baseDir = path.join(this._context.rootDirectory, '..');
                
                // Generate IP if required
                if (isValueEmpty('APP_IP')) {
                    let nextIp = this._context.registry.get('nextIp', 2136473601);
                    // Handle legacy IP value @todo remove in next major release
                    if (nextIp >= 127088000001) {
                        nextIp = Ip.ip2long(Ip.legacy2ip(nextIp));
                    }
                    env.set('APP_IP', Ip.long2ip(++nextIp) + '');
                    this._context.registry.set('nextIp', nextIp);
                }
                
                // Generate domain if required
                if (isValueEmpty('APP_DOMAIN')) {
                    const domain = encodeURI(projectShortName).replace(/_/g, '-')
                                   + this._context.config.get('network.domain.base');
                    env.set('APP_DOMAIN', domain);
                }
                
                // Set empty variables
                setValueIfEmpty('PROJECT_ENV', 'dev');
                
                // Set optional directories
                setValueIfKeyExistsAndEmpty('APP_ROOT_DIR', this._context.rootDirectory);
                setValueIfKeyExistsAndEmpty('APP_PARENT_DIR', baseDir + path.sep);
                setValueIfKeyExistsAndEmpty('APP_WORKING_DIR',
                    path.join(this._context.rootDirectory, 'src') + path.sep);
                setValueIfKeyExistsAndEmpty('APP_DATA_DIR', path.join(baseDir, 'data') + path.sep);
                setValueIfKeyExistsAndEmpty('APP_LOG_DIR', path.join(baseDir, 'logs') + path.sep);
                setValueIfKeyExistsAndEmpty('APP_IMPORT_DIR', path.join(baseDir, 'import') + path.sep);
                setValueIfKeyExistsAndEmpty('APP_SSH_DIR', path.join(baseDir, 'ssh') + path.sep);
                setValueIfKeyExistsAndEmpty('APP_OPT_DIR', path.join(this._context.rootDirectory, 'opt') + path.sep);
                
                // Set optional values
                const passwordGenerator = function (): string {
                    return (md5(projectName + Math.random()) + 'ABCDEJKLOXYZ-_!#')
                        .split('').sort(function () {
                            return 0.5 - Math.random();
                        }).join('');
                };
                setValueIfKeyExistsAndEmpty('APP_MYSQL_DATABASE', projectShortName + '_d');
                setValueIfKeyExistsAndEmpty('APP_MYSQL_USER', projectShortName + '_d');
                setValueIfKeyExistsAndEmpty('APP_MYSQL_PASS', passwordGenerator());
                setValueIfKeyExistsAndEmpty('APP_MYSQL_PORT', '3306');
                setValueIfKeyExistsAndEmpty('MYSQL_ROOT_PASSWORD', passwordGenerator());
                setValueIfKeyExistsAndEmpty('APP_SQL_PASS', passwordGenerator());
                setValueIfKeyExistsAndEmpty('APP_SQL_PORT', '1433');
                setValueIfKeyExistsAndEmpty('APP_SQL_DATABASE', projectShortName + '_d');
                setValueIfKeyExistsAndEmpty('APP_PROTOCOL', 'https://');
            });
    }
    
    /**
     * Generates a new .env.template file based on the new .env file
     */
    protected generateEnvTemplateFile(filename: string): Promise<void>
    {
        const env = new DockerEnv(path.join(this._context.rootDirectory, filename));
        const envTemplate = new DockerEnvTemplate(path.join(this._context.rootDirectory, filename + '.template'));
        envTemplate.writeTemplate(env);
        return Promise.resolve();
    }
    
    /**
     * Writes the domain of the app into the hosts file and links it with the given ip address
     */
    protected registerDomainInHostsFile(): Promise<void>
    {
        const hosts = new DockerHosts(this._context);
        try {
            hosts.set(this._app.env.get('APP_IP'), this._app.env.get('APP_DOMAIN'));
            hosts.write();
        } catch (e) {
            // Check if we can handle this error
            if (e.message.indexOf('Hosts file conflict:') !== 0) {
                throw e;
            }
            return new Promise<void>(resolve => {
                console.log(chalk.yellowBright(e.message));
                return inquirer.prompt(
                    [
                        {
                            name: 'ok',
                            message: 'It seems like the domain: ' + this._app.env.get('APP_DOMAIN') +
                                     ' is already in use in your hosts file, should I overwrite it with the config for this app?',
                            type: 'confirm',
                            default: true
                        }
                    ]).then(
                    answers => {
                        Bugfixes.inquirerChildProcessReadLineFix();
                        if (answers.ok === false) {
                            console.log(chalk.redBright('Please fix your hosts file before continuing!'));
                            process.exit();
                        }
                        hosts.removeDomain(this._app.env.get('APP_DOMAIN'));
                        hosts.set(this._app.env.get('APP_IP'), this._app.env.get('APP_DOMAIN'));
                        hosts.write();
                        resolve();
                    });
            });
        }
    }
    
    /**
     * Creates all directories that have been registered in the .env file
     */
    protected createRegisteredDirectories(): Promise<void>
    {
        // Gather the list of missing directories
        const missingDirectories: Array<string> = [];
        forEach(this._app.env.getAll(), (v: string, k: string) => {
            if (!k.match(/^APP_.*?_DIR/)) {
                return;
            }
            if (v === '' || v === 'null' || v.indexOf('§') === 0) {
                return;
            }
            if (fs.existsSync(v)) {
                return;
            }
            missingDirectories.push(v);
        });
        if (missingDirectories.length === 0) {
            return Promise.resolve();
        }
        
        // Ask if we should create the directories
        return inquirer.prompt(
            [
                {
                    name: 'ok',
                    message: 'The following directories do not exist. Should I create them?' + '\n - ' +
                             missingDirectories.join('\n - ') + '\n',
                    type: 'confirm',
                    default: true
                }
            ]).then(
            answers => {
                Bugfixes.inquirerChildProcessReadLineFix();
                if (answers.ok === false) {
                    return;
                }
                forEach(missingDirectories, (dir: string) => {
                    mkdirRecursiveSync(dir);
                });
            });
    }
    
    /**
     * Selects the default service key
     */
    protected selectDefaultService(): Promise<void>
    {
        return DockerComposeServiceSelectWizard.run(
            this._app.dockerCompose,
            'use as default service key (shell, open,...)',
            'app',
            this._context.appRegistry.get('defaultServiceContainer')
        ).then(
            (key: string) => {
                this._context.appRegistry.set('defaultServiceContainer', key);
            }
        );
    }
    
    /**
     * Writes all persisted data into the registry
     */
    protected writeDockerAppConfig(): Promise<void>
    {
        // Start building the configuration
        const config = this._context.appRegistry.get('dockerApp', {});
        config.hash = this._app.calculateDockerFileHash();
        
        // Store the updated config
        this._context.appRegistry.set('dockerApp', config);
        return Promise.resolve();
    }
}