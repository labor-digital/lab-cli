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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerCompose = void 0;
const ForEachHelper_1 = require("../Core/Utils/ForEachHelper");
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
 * Last modified: 2020.04.06 at 09:44
 */
const radashi_1 = require("radashi");
const childProcess = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const semver_1 = require("semver");
// @ts-ignore
const yaml = __importStar(require("yamljs"));
const DockerHosts_1 = require("../Core/DockerApp/DockerHosts");
const Network_1 = require("./Network");
class DockerCompose {
    /**
     * DockerCompose Constructor
     * @param dockerApp
     */
    constructor(dockerApp) {
        this._app = dockerApp;
    }
    /**
     * Returns the version number of the currently installed docker compose binary
     */
    get version() {
        if (!this._version) {
            const command = 'docker compose version --short';
            const result = childProcess.execSync(command).toString('utf8');
            this._version = (0, semver_1.clean)(result);
        }
        return this._version;
    }
    /**
     * Returns the project's docker compose configuration
     * @param forceReload Set to true to reload the config instead of serving it from cache
     */
    getConfig(forceReload) {
        if (forceReload !== true && !(this._config === undefined)) {
            return this._config;
        }
        var result = null;
        try {
            const command = this.baseDockerComposeCommand + ' config';
            result = childProcess.execSync(command, { env: this.execEnv }).toString('utf8');
            if (result.indexOf('services') === -1) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('There are no services in the docker compose config!');
            }
        }
        catch (e) {
            throw new Error('Error while reading docker compose config:\n' + e.message);
        }
        // Parse yaml
        return this._config = yaml.parse(result.replace(/\t/g, '  '));
    }
    /**
     * Gathers a list of all services in the current docker compose configuration
     */
    getServiceList(forceReload) {
        // Check if we can use the cached list for faster lookups
        if (forceReload !== true && this._app.context.appRegistry.has('serviceList')) {
            return this._app.context.appRegistry.get('serviceList');
        }
        const config = this.getConfig(forceReload);
        const services = [];
        (0, ForEachHelper_1.forEach)(config.services, (service, k) => {
            if (!(0, radashi_1.isString)(service.container_name)) {
                return;
            }
            services.push({
                key: k,
                containerName: service.container_name
            });
        });
        this._app.context.appRegistry.set('serviceList', services);
        return services;
    }
    test(forceUpdate) {
        return new Promise((resolve, reject) => {
            console.log('Starting the test container...');
            const command = this.baseDockerComposeCommand + 'run --rm test npm run ' + (forceUpdate ? "test-update" : "test");
            try {
                childProcess.execSync(command, { stdio: 'inherit', env: this.execEnv });
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Performs the "up" command for the current app
     *
     * @param followOutput True to follow the output if not given or false the -d arg is set
     * @param pullImages True to force pull the images used in the app before starting it
     */
    up(followOutput, pullImages) {
        return new Promise((resolve, reject) => {
            console.log('Starting application...');
            // Make the worktree's bind-mount targets exist and keep the hosts entry
            // in sync with the effective (worktree) identity before starting.
            this.ensureOverlayDirectories();
            (new Network_1.Network(this._app.context))
                .registerLoopBackAliasIfRequired(this._app.identity.appIp);
            this.syncHostsEntry();
            const noAnsi = followOutput === true || !this._app.context.platform.isWindows;
            const noAnsiCommand = (0, semver_1.gte)(this.version, '1.29.0') ? '--ansi never ' : '--no-ansi ';
            const command = this.baseDockerComposeCommand +
                (pullImages === true ? 'pull && ' + this.baseDockerComposeCommand : '') +
                (noAnsi ? '' : noAnsiCommand) +
                'up --remove-orphans' + (followOutput === true ? '' : ' -d');
            try {
                childProcess.execSync(command, { stdio: 'inherit', env: this.execEnv });
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Performs the "stop" command for the current app
     * @param kill True to kill the app instead of stopping it gracefully
     */
    stop(kill) {
        return new Promise((resolve, reject) => {
            console.log('Stopping application...');
            const command = this.baseDockerComposeCommand + (kill ? 'kill' : 'stop');
            try {
                childProcess.execSync(command, { stdio: 'inherit', env: this.execEnv });
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Executes a "docker compose down" on the current application
     * @param removeImages True to remove all images as well
     */
    down(removeImages) {
        return new Promise((resolve, reject) => {
            console.log('Removing application data...');
            const command = this.baseDockerComposeCommand + ' down ' +
                (removeImages === true ? ' --rmi all' : '');
            try {
                childProcess.execSync(command, { stdio: 'inherit', env: this.execEnv });
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Attaches the current cli to the docker compose logs
     * @param lines Optional number of lines to render
     * @param follow True to follow the logs
     */
    attachToLogs(lines, follow) {
        return new Promise((resolve, reject) => {
            if (!(0, radashi_1.isNumber)(lines)) {
                lines = 15;
            }
            const command = this.baseDockerComposeCommand + 'logs --timestamps ' +
                '--tail="' + lines + '" ' + (follow === true ? '--follow ' : '');
            try {
                childProcess.execSync(command, { stdio: 'inherit', env: this.execEnv });
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Checks if at least one of the containers in the docker compose app is running
     */
    get isRunning() {
        const command = this.baseDockerComposeCommand + 'ps';
        const content = childProcess.execSync(command, { stdio: 'pipe', env: this.execEnv }).toString('utf-8');
        const lines = content.split(/\r?\n/);
        let isRunning = false;
        (0, ForEachHelper_1.forEach)(lines, (line) => {
            if (line.charAt(0) === ' ') {
                return;
            }
            if (line.charAt(0) === '-') {
                return;
            }
            if (line.trim() === '') {
                return;
            }
            if (line.indexOf(' Exit ') !== -1) {
                return;
            }
            if (line.indexOf('Name ') === 0) {
                return;
            }
            isRunning = true;
            return false;
        });
        return isRunning;
    }
    /**
     * The environment to run docker compose with. When the app has an isolated
     * identity (git worktree or --domain/--ip overrides) the effective compose
     * project / domain / ip are injected here so they OVERRIDE the .env file
     * values (shell env wins over .env in compose) without rewriting .env.
     * Returns undefined for a plain run, so the process env is inherited as-is.
     */
    get execEnv() {
        const identity = this._app.identity;
        if (!identity.isOverlay) {
            return undefined;
        }
        return Object.assign(Object.assign(Object.assign({}, process.env), { COMPOSE_PROJECT_NAME: identity.composeProjectName, APP_DOMAIN: identity.appDomain, APP_IP: identity.appIp }), identity.dirs);
    }
    /**
     * Makes sure the worktree-relative directories (data, logs, ...) exist before
     * they are bind-mounted, so docker does not create them as root-owned empties.
     * No-op for a plain main-checkout run.
     */
    ensureOverlayDirectories() {
        const dirs = this._app.identity.dirs;
        Object.keys(dirs).forEach(key => {
            const dir = dirs[key];
            if (dir && !fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    /**
     * Keeps the hosts-file entry in sync with the effective identity on every "up"
     * (not just during init), so the app's domain always resolves to the ip it is
     * actually bound to - e.g. a worktree domain points at the worktree ip, not the
     * main app's. Writes only when something changed and never blocks "up".
     */
    syncHostsEntry() {
        try {
            const identity = this._app.identity;
            const hosts = new DockerHosts_1.DockerHosts(this._app.context);
            hosts.set(identity.appIp, identity.appDomain);
            hosts.write();
        }
        catch (e) {
            // A genuine conflict is handled (with prompts) during init; do not block "up".
        }
    }
    /**
     * Returns the prepared docker compose base command
     */
    get baseDockerComposeCommand() {
        return this._app.context.platform.choose({ windows: 'cd /d ', linux: 'cd ' }) +
            '"' + this._app.context.rootDirectory + '" && ' +
            'docker compose ' +
            (!(this._app.dockerComposeFile === undefined) ?
                ' -f "' + this._app.dockerComposeFile + '"' : '') +
            (!(this._app.dockerComposeOverrideFile === undefined) ?
                ' -f "' + this._app.dockerComposeOverrideFile + '"' : '') +
            ' ';
    }
}
exports.DockerCompose = DockerCompose;
//# sourceMappingURL=DockerCompose.js.map