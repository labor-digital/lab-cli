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
exports.DockerAppInit = void 0;
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
 * Last modified: 2020.04.05 at 21:46
 */
const radashi_1 = require("radashi");
const crypto = __importStar(require("crypto"));
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const inquirer_1 = __importDefault(require("inquirer"));
const path = __importStar(require("path"));
const Ip_1 = require("../../Api/Ip");
const AppEventList_1 = require("../AppEventList");
const Bugfixes_1 = require("../Bugfixes");
const DockerComposeServiceSelectWizard_1 = require("../Ui/DockerComposeServiceSelectWizard");
const ProjectNameInputWizard_1 = require("../Ui/ProjectNameInputWizard");
const DockerEnv_1 = require("./DockerEnv");
const DockerEnvTemplate_1 = require("./DockerEnvTemplate");
const DockerHosts_1 = require("./DockerHosts");
class DockerAppInit {
    /**
     * DockerAppInit Constructor
     *
     * @param dockerComposeFile
     * @param context
     * @param app
     */
    constructor(dockerComposeFile, context, app) {
        this._dockerComposeFile = dockerComposeFile;
        this._context = context;
        this._app = app;
    }
    /**
     * Main controller to initialize a docker application
     */
    run() {
        console.log('Found changes on your docker app files or doppler service token has expired! Checking your setup...');
        return Promise.resolve()
            .then(() => this._context.emitSequentialHook(AppEventList_1.AppEventList.DOCKER_APP_BEFORE_INIT, { app: this._app }))
            .then(() => this.clearCachedValues())
            .then(() => this.makeSureEnvFileExists('.env'))
            .then(() => this.makeSureEnvFileExists('.env.app'))
            .then(() => this._context.emitSequentialHook(AppEventList_1.AppEventList.DOCKER_APP_AFTER_ENV_FILE_CHECK, { app: this._app }))
            .then(() => this.fillEmptyValuesInEnvFile())
            .then(() => this.fillEmptyValuesInEnvAppFile())
            .then(() => this.generateEnvTemplateFile('.env'))
            .then(() => this.generateEnvTemplateFile('.env.app'))
            .then(() => this._context.emitSequentialHook(AppEventList_1.AppEventList.DOCKER_APP_AFTER_ENV_INIT, { app: this._app }))
            .then(() => this.registerDomainInHostsFile())
            .then(() => this._context.emitSequentialHook(AppEventList_1.AppEventList.DOCKER_APP_AFTER_HOST_FILE_UPDATE, { app: this._app }))
            .then(() => this.createRegisteredDirectories())
            .then(() => this._context.emitSequentialHook(AppEventList_1.AppEventList.DOCKER_APP_AFTER_DIRECTORIES, { app: this._app }))
            .then(() => this.selectDefaultService())
            .then(() => this._context.emitSequentialHook(AppEventList_1.AppEventList.DOCKER_APP_AFTER_DEFAULT_SERVICE, { app: this._app }))
            .then(() => this.writeDockerAppConfig())
            .then(() => this._context.emitSequentialHook(AppEventList_1.AppEventList.DOCKER_APP_INIT_DONE, { app: this._app }))
            .then(() => {
        });
    }
    /**
     * Removes some cached values from the app registry
     */
    clearCachedValues() {
        this._context.appRegistry.remove('serviceList');
        return Promise.resolve();
    }
    /**
     * Makes sure that the .env file exists right beside the docker compose file
     */
    makeSureEnvFileExists(filename) {
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
     * Parses the .env.app file of the docker app and fills empty values with automatically generated defaults
     */
    fillEmptyValuesInEnvAppFile() {
        // Load the env
        const envFilePath = path.join(this._context.rootDirectory, '.env.app');
        const env = new DockerEnv_1.DockerEnv(envFilePath);
        function isValueEmpty(key) {
            return !env.has(key) || !(0, radashi_1.isString)(env.get(key)) ||
                env.get(key).trim() === 'null' ||
                env.get(key).trim().charAt(0) === '§';
        }
        function setValueIfEmpty(key, value) {
            if (isValueEmpty(key)) {
                env.set(key, value);
            }
        }
        const defaultFileOwner = this._context.platform.defaultFileOwner();
        if (defaultFileOwner !== null) {
            setValueIfEmpty('DEFAULT_OWNER', defaultFileOwner);
        }
        return Promise.resolve();
    }
    /**
     * Parses the .env file of the docker app and fills empty values with automatically generated defaults
     */
    fillEmptyValuesInEnvFile() {
        // Load the env
        const envFilePath = path.join(this._context.rootDirectory, '.env');
        const env = new DockerEnv_1.DockerEnv(envFilePath);
        this._app.env = env;
        function isValueEmpty(key) {
            return !env.has(key) || !(0, radashi_1.isString)(env.get(key)) ||
                env.get(key).trim() === 'null' ||
                env.get(key).trim().charAt(0) === '§';
        }
        function hasKey(key) {
            return env.has(key);
        }
        function hasKeyAndIsValueEmpty(key) {
            return hasKey(key) && isValueEmpty(key);
        }
        function setValueIfEmpty(key, value) {
            if (isValueEmpty(key)) {
                env.set(key, value);
            }
        }
        function setValueIfKeyExistsAndEmpty(key, value) {
            if (hasKeyAndIsValueEmpty(key)) {
                env.set(key, value);
            }
        }
        // Make sure we have the COMPOSE_PROJECT_NAME variable
        return (isValueEmpty('COMPOSE_PROJECT_NAME') ? () => ProjectNameInputWizard_1.ProjectNameInputWizard.run('Your .env file does not contain a: "COMPOSE_PROJECT_NAME" parameter. Define the name of the project based on the following options:', this._context, undefined, this._app.acceptDefaults).then((name) => {
            env.set('COMPOSE_PROJECT_NAME', name);
            return name;
        }) : () => Promise.resolve(env.get('COMPOSE_PROJECT_NAME')))()
            .then((projectName) => {
            const makeShortName = (name) => name
                .trim()
                .split('-')
                .map(v => v.replace(/_/, '').trim().substr(0, 3))
                .join('_')
                .toLowerCase();
            // When running inside a linked git worktree the app gets its own
            // isolated identity (compose project, domain, ip, hosts entry and
            // database names) so it can run side by side with the main checkout.
            // The doppler project intentionally stays on the base name below, so
            // the worktree keeps sharing its secrets with the main checkout.
            const worktree = this._context.worktree;
            const baseProjectName = worktree.isWorktree
                ? this.stripWorktreeSuffix(projectName, worktree.name)
                : projectName;
            const effectiveProjectName = worktree.isWorktree && worktree.name
                ? baseProjectName + '-' + worktree.name
                : projectName;
            // Persist the worktree-effective compose project name. docker compose
            // reads COMPOSE_PROJECT_NAME from the .env file, so this alone isolates
            // all containers, networks and volumes of the worktree. Guarded so a
            // re-run (value already suffixed) does not rewrite the file needlessly.
            if (env.get('COMPOSE_PROJECT_NAME') !== effectiveProjectName) {
                env.set('COMPOSE_PROJECT_NAME', effectiveProjectName);
            }
            const projectShortName = makeShortName(effectiveProjectName);
            const baseShortName = makeShortName(baseProjectName);
            // Prepare the app base directory
            const baseDir = path.join(this._context.rootDirectory, '..');
            // Generate IP if required
            if (isValueEmpty('APP_IP')) {
                let nextIp = this._context.registry.get('nextIp', 2136473601);
                // Handle legacy IP value @todo remove in next major release
                if (nextIp >= 127088000001) {
                    nextIp = Ip_1.Ip.ip2long(Ip_1.Ip.legacy2ip(nextIp));
                }
                env.set('APP_IP', Ip_1.Ip.long2ip(++nextIp) + '');
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
            // Set empty doppler variables.
            // Note: the BASE short name is used on purpose so a worktree shares
            // the doppler project (and therefore the secrets) with the main checkout.
            setValueIfKeyExistsAndEmpty('DOPPLER_PROJECT', baseShortName);
            setValueIfKeyExistsAndEmpty('DOPPLER_CONFIG', 'dev');
            // Generate doppler token if required
            if (hasKey('DOPPLER_TOKEN') && (isValueEmpty('DOPPLER_TOKEN') ||
                !this._app.doppler.checkIfValidServiceTokenExists(env.get('DOPPLER_PROJECT'), env.get('DOPPLER_CONFIG')))) {
                const dopplerToken = this._app.doppler.generateServiceToken(env.get('DOPPLER_PROJECT'), env.get('DOPPLER_CONFIG'));
                env.set('DOPPLER_TOKEN', dopplerToken);
            }
            // Set optional directories
            setValueIfKeyExistsAndEmpty('APP_ROOT_DIR', this._context.rootDirectory);
            setValueIfKeyExistsAndEmpty('APP_PARENT_DIR', baseDir + path.sep);
            setValueIfKeyExistsAndEmpty('APP_WORKING_DIR', path.join(this._context.rootDirectory, 'src') + path.sep);
            setValueIfKeyExistsAndEmpty('APP_DATA_DIR', path.join(baseDir, 'data') + path.sep);
            setValueIfKeyExistsAndEmpty('APP_LOG_DIR', path.join(baseDir, 'logs') + path.sep);
            setValueIfKeyExistsAndEmpty('APP_IMPORT_DIR', path.join(baseDir, 'import') + path.sep);
            setValueIfKeyExistsAndEmpty('APP_SSH_DIR', path.join(baseDir, 'ssh') + path.sep);
            setValueIfKeyExistsAndEmpty('APP_OPT_DIR', path.join(this._context.rootDirectory, 'opt') + path.sep);
            // Set optional values
            const passwordGenerator = function () {
                return (crypto.createHash("md5").update(projectName + Math.random().toString()).digest("hex") + 'ABCDEJKLOXYZ-_!#')
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
     * Removes a previously applied worktree suffix ("-<name>") from a compose
     * project name so re-running the init does not stack suffixes on top of each other.
     */
    stripWorktreeSuffix(projectName, suffix) {
        if (!suffix) {
            return projectName;
        }
        const tail = '-' + suffix;
        return projectName.toLowerCase().endsWith(tail.toLowerCase())
            ? projectName.substr(0, projectName.length - tail.length)
            : projectName;
    }
    /**
     * Generates a new .env.template file based on the new .env file
     */
    generateEnvTemplateFile(filename) {
        // Never rewrite the committed .env.template from within a linked worktree:
        // the template is a shared artifact owned by the main checkout and would
        // otherwise be polluted with worktree specific values (e.g. the suffixed
        // COMPOSE_PROJECT_NAME), showing up as an unexpected change in "git status".
        if (this._context.worktree.isWorktree) {
            return Promise.resolve();
        }
        const env = new DockerEnv_1.DockerEnv(path.join(this._context.rootDirectory, filename));
        const envTemplate = new DockerEnvTemplate_1.DockerEnvTemplate(path.join(this._context.rootDirectory, filename + '.template'));
        envTemplate.writeTemplate(env);
        return Promise.resolve();
    }
    /**
     * Writes the domain of the app into the hosts file and links it with the given ip address
     */
    registerDomainInHostsFile() {
        const hosts = new DockerHosts_1.DockerHosts(this._context);
        try {
            hosts.set(this._app.env.get('APP_IP'), this._app.env.get('APP_DOMAIN'));
            hosts.write();
        }
        catch (e) {
            // Check if we can handle this error
            if (e.message.indexOf('Hosts file conflict:') !== 0) {
                throw e;
            }
            if (this._app.acceptDefaults) {
                console.log(chalk_1.default.yellowBright(e.message));
                console.log('Overwriting hosts file entry for: ' + this._app.env.get('APP_DOMAIN'));
                const hosts2 = new DockerHosts_1.DockerHosts(this._context);
                hosts2.removeDomain(this._app.env.get('APP_DOMAIN'));
                hosts2.set(this._app.env.get('APP_IP'), this._app.env.get('APP_DOMAIN'));
                hosts2.write();
                return Promise.resolve();
            }
            return new Promise(resolve => {
                console.log(chalk_1.default.yellowBright(e.message));
                return inquirer_1.default.prompt([
                    {
                        name: 'ok',
                        message: 'It seems like the domain: ' + this._app.env.get('APP_DOMAIN') +
                            ' is already in use in your hosts file, should I overwrite it with the config for this app?',
                        type: 'confirm',
                        default: true
                    }
                ]).then(answers => {
                    Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                    if (answers.ok === false) {
                        console.log(chalk_1.default.redBright('Please fix your hosts file before continuing!'));
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
    createRegisteredDirectories() {
        // Gather the list of missing directories
        const missingDirectories = [];
        (0, ForEachHelper_1.forEach)(this._app.env.getAll(), (v, k) => {
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
        // Auto-create directories if acceptDefaults is set
        if (this._app.acceptDefaults) {
            console.log('Creating directories:\n - ' + missingDirectories.join('\n - '));
            (0, ForEachHelper_1.forEach)(missingDirectories, (dir) => {
                fs.mkdirSync(dir, { recursive: true });
            });
            return Promise.resolve();
        }
        // Ask if we should create the directories
        return inquirer_1.default.prompt([
            {
                name: 'ok',
                message: 'The following directories do not exist. Should I create them?' + '\n - ' +
                    missingDirectories.join('\n - ') + '\n',
                type: 'confirm',
                default: true
            }
        ]).then(answers => {
            Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
            if (answers.ok === false) {
                return;
            }
            (0, ForEachHelper_1.forEach)(missingDirectories, (dir) => {
                fs.mkdirSync(dir, { recursive: true });
            });
        });
    }
    /**
     * Selects the default service key
     */
    selectDefaultService() {
        return DockerComposeServiceSelectWizard_1.DockerComposeServiceSelectWizard.run(this._app.dockerCompose, 'use as default service key (shell, open,...)', 'app', this._context.appRegistry.get('defaultServiceContainer'), this._app.acceptDefaults).then((key) => {
            this._context.appRegistry.set('defaultServiceContainer', key);
        });
    }
    /**
     * Writes all persisted data into the registry
     */
    writeDockerAppConfig() {
        // Start building the configuration
        const config = this._context.appRegistry.get('dockerApp', {});
        config.hash = this._app.calculateDockerFileHash();
        // Store the updated config
        this._context.appRegistry.set('dockerApp', config);
        return Promise.resolve();
    }
}
exports.DockerAppInit = DockerAppInit;
//# sourceMappingURL=DockerAppInit.js.map