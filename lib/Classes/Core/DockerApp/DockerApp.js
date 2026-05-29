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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerApp = void 0;
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
 * Last modified: 2020.04.05 at 16:05
 */
const radashi_1 = require("radashi");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const inquirer_1 = __importDefault(require("inquirer"));
const path = __importStar(require("path"));
const Docker_1 = require("../../Api/Docker");
const DockerCompose_1 = require("../../Api/DockerCompose");
const Doppler_1 = require("../../Api/Doppler");
const Bugfixes_1 = require("../Bugfixes");
const UserError_1 = require("../Error/UserError");
const DockerAppInit_1 = require("./DockerAppInit");
const DockerEnv_1 = require("./DockerEnv");
class DockerApp {
    constructor(context) {
        /**
         * When true, all interactive prompts will be auto-accepted with defaults
         */
        this.acceptDefaults = false;
        this._context = context;
        this._api = new Docker_1.Docker(context);
        this._doppler = new Doppler_1.Doppler(context);
        this._dockerCompose = new DockerCompose_1.DockerCompose(this);
    }
    /**
     * Returns the environment config for the docker app
     */
    get env() {
        return this._env;
    }
    /**
     * Updates the environment config for the docker app
     * @param env
     */
    set env(env) {
        this._env = env;
    }
    /**
     * Returns the main docker compose file path
     */
    get dockerComposeFile() {
        if (this._dockerComposeFile === '-1') {
            return undefined;
        }
        (0, ForEachHelper_1.forEach)(DockerApp.dockerComposeRootFiles, (filename) => {
            filename = path.join(this._context.rootDirectory, filename);
            if (!fs.existsSync(filename)) {
                return;
            }
            this._dockerComposeFile = filename;
        });
        if (!(this._dockerComposeFile === undefined)) {
            return this._dockerComposeFile;
        }
        this._dockerComposeFile = '-1';
        return undefined;
    }
    /**
     * Returns the path to the docker compose override file
     */
    get dockerComposeOverrideFile() {
        if (this._dockerComposeOverrideFile === '-1') {
            return undefined;
        }
        (0, ForEachHelper_1.forEach)(DockerApp.dockerComposeOverrideFiles, (filename) => {
            filename = path.join(this._context.rootDirectory, filename);
            if (!fs.existsSync(filename)) {
                return;
            }
            this._dockerComposeOverrideFile = filename;
        });
        if (!(this._dockerComposeOverrideFile === undefined)) {
            return this._dockerComposeOverrideFile;
        }
        this._dockerComposeOverrideFile = '-1';
        return undefined;
    }
    /**
     * Returns the path to the import / export directory
     */
    get importExportDirectory() {
        let importDir = this.env.get('APP_IMPORT_DIR');
        if ((0, radashi_1.isString)(importDir)) {
            return importDir;
        }
        return path.join(this._context.rootDirectory, 'import');
    }
    /**
     * Returns the path to the test directory
     */
    get testDirectory() {
        let testDir = this.env.get('APP_ROOT_DIR');
        if ((0, radashi_1.isString)(testDir)) {
            return path.join(testDir, 'tests');
        }
        return path.join(this._context.rootDirectory, 'app', 'tests');
    }
    /**
     * Returns the instance of the docker api
     */
    get docker() {
        return this._api;
    }
    /**
     * Returns the instance of the doppler api
     */
    get doppler() {
        return this._doppler;
    }
    /**
     * Returns the context instance for this app
     */
    get context() {
        return this._context;
    }
    /**
     * Returns the instance of the docker compose api
     */
    get dockerCompose() {
        return this._dockerCompose;
    }
    /**
     * Returns the container name, resolved via the configuration or by resolving to the default container name
     */
    get containerName() {
        // Find the container name by the configured service key
        const serviceKey = this._context.config.get('docker.serviceKey');
        if (!(serviceKey === undefined)) {
            let containerName = undefined;
            const services = this.dockerCompose.getServiceList();
            (0, ForEachHelper_1.forEach)(services, (service) => {
                if (service.key !== serviceKey) {
                    return;
                }
                containerName = service.containerName;
                return false;
            });
            if ((0, radashi_1.isString)(containerName)) {
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
    get serviceKey() {
        // Check if the key was configured
        let serviceKey = this._context.config.get('docker.serviceKey');
        if (!(serviceKey === undefined)) {
            return serviceKey;
        }
        // Find the service by the container name
        const containerName = this.containerName;
        const services = this.dockerCompose.getServiceList();
        (0, ForEachHelper_1.forEach)(services, (service) => {
            if (service.containerName !== containerName) {
                return;
            }
            serviceKey = service.key;
            return false;
        });
        if (!(0, radashi_1.isString)(serviceKey)) {
            return 'app';
        }
        return serviceKey;
    }
    /**
     * Checks if the stored docker configuration for the current app is up to date or runs the init process
     */
    initialize() {
        // Check if we have docker files
        if (!this.hasDockerFiles()) {
            return Promise.reject(new Error('There are no docker compose files in the directory: "' + this._context.rootDirectory + '\!'));
        }
        // Check if docker is running
        if (!this._api.isInstalled) {
            return Promise.reject(new Error('It seems like docker is currently not installed on your system!'));
        }
        // Check if doppler is installed
        if (!this._doppler.isInstalled()) {
            return Promise.reject(new Error('It seems like doppler is currently not installed on your system!'));
        }
        return this
            // Check if docker is running and start it if necessary
            .startDockerIfRequired()
            .then(() => {
            return this.loginToDopplerIfRequired();
        })
            .then(() => {
            // Check if we have a config
            const config = this._context.appRegistry.get('dockerApp', {});
            if ((0, radashi_1.isEmpty)(config)) {
                return this.runInit();
            }
            // Check if we have a change in the docker files
            if (config.hash !== this.calculateDockerFileHash()) {
                return this.runInit();
            }
            // Initialize the env
            this._env = new DockerEnv_1.DockerEnv(path.join(this._context.rootDirectory, '.env'));
            // Check if there still is a valid service token in doppler
            if (this._env.has('DOPPLER_PROJECT') && this._env.has('DOPPLER_CONFIG') &&
                !this.doppler.checkIfValidServiceTokenExists(this._env.get('DOPPLER_PROJECT'), this._env.get('DOPPLER_CONFIG'))) {
                return this.runInit();
            }
            // Nothing to do
            return Promise.resolve(this);
        });
    }
    /**
     * Calculates a hash sum for all docker relevant files
     */
    calculateDockerFileHash() {
        const rawHash = [];
        (0, ForEachHelper_1.forEach)([...DockerApp.dockerComposeRootFiles, ...DockerApp.dockerConfigFiles], (file) => {
            const filename = path.join(this._context.rootDirectory, file);
            if (!fs.existsSync(filename)) {
                rawHash.push('0');
            }
            else {
                rawHash.push(crypto.createHash("md5").update(fs.readFileSync(filename)).digest("hex"));
            }
        });
        return crypto.createHash("md5").update(rawHash.join(',')).digest("hex");
    }
    /**
     * Returns true if there are docker related files in the current root directory, false if not
     */
    hasDockerFiles() {
        return !(this.dockerComposeFile === undefined);
    }
    /**
     * Checks if the docker engine is currently running.
     * If not it will ask the user to start the engine automatically
     */
    startDockerIfRequired() {
        if (this._api.isRunning) {
            return Promise.resolve();
        }
        if (this.acceptDefaults) {
            console.log('Starting docker engine...');
            return this._api.startEngine();
        }
        // Ask user
        return inquirer_1.default.prompt({
            name: 'startDocker',
            type: 'confirm',
            message: 'The Docker Engine is not running. Should I start it for you?'
        }).then(answers => {
            Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
            if (!answers.startDocker) {
                return Promise.reject(new UserError_1.UserError('Sorry, this can\'t be done without docker running!'));
            }
            console.log('Starting docker engine...');
            return this._api.startEngine();
        });
    }
    /**
     * Checks if doppler is loggedIn.
     * If not it will ask the user if he now wants to login
     */
    loginToDopplerIfRequired() {
        return __awaiter(this, arguments, void 0, function* (reloginDueToTimeout = false) {
            if (this._doppler.isLoggedIn) {
                return Promise.resolve();
            }
            if (this.acceptDefaults) {
                const loginCode = this._doppler.login(15);
                switch (loginCode) {
                    case -1:
                        return this.loginToDopplerIfRequired(true);
                    case 1:
                        return Promise.resolve();
                    default:
                    case 0:
                        return Promise.reject(new Error('Sorry, something went wrong while logging you into doppler!'));
                }
            }
            // Ask user
            return inquirer_1.default.prompt({
                name: 'loginDoppler',
                type: 'confirm',
                message: reloginDueToTimeout ?
                    'Looks like your login timed out. This could happen if you had to log into doppler in your browser. Should we just restart the login attempt here?' :
                    'You´re not logged into doppler. Should I log you in?',
            }).then(answers => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.loginDoppler) {
                    return Promise.reject(new UserError_1.UserError('Sorry, this can\'t be done without logging into doppler!'));
                }
                const loginCode = this._doppler.login(15);
                switch (loginCode) {
                    case -1:
                        return this.loginToDopplerIfRequired(true);
                    case 1:
                        return Promise.resolve();
                    default:
                    case 0:
                        return Promise.reject(new Error('Sorry, something went wrong while logging you into doppler!'));
                }
            });
        });
    }
    /**
     * Runs the docker app init controller to make sure everything is set up correctly
     */
    runInit() {
        return (new DockerAppInit_1.DockerAppInit(this._dockerComposeFile, this._context, this))
            .run()
            .then(() => this);
    }
}
exports.DockerApp = DockerApp;
DockerApp.dockerComposeRootFiles = [
    'docker-compose.dev.yml',
    'docker-compose.yml'
];
DockerApp.dockerComposeOverrideFiles = [
    'docker-compose.dev.override.yml',
    'docker-compose.override.yml'
];
DockerApp.dockerConfigFiles = [
    ...DockerApp.dockerComposeOverrideFiles,
    '.env',
    '.env.app'
];
//# sourceMappingURL=DockerApp.js.map