"use strict";
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
 * Last modified: 2020.07.09 at 18:26
 */
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
exports.Doppler = void 0;
const childProcess = __importStar(require("child_process"));
class Doppler {
    /**
     * Docker Constructor
     * @param context
     */
    constructor(context) {
        this._context = context;
        this._isInstalled = null;
    }
    /**
     * Returns git's install location or an empty string
     */
    getLocation() {
        try {
            return childProcess.execSync(this._context.platform.choose({
                windows: 'WHERE doppler',
                linux: 'which doppler'
            }), { 'stdio': 'pipe' })
                .toString('utf8').replace(/(\r?\n)+(.*)$/gm, '');
        }
        catch (e) {
            return '';
        }
    }
    /**
     * Returns true if git is installed on the machine
     */
    isInstalled() {
        if (this._isInstalled === true) {
            return true;
        }
        const executableMarker = this._context.platform.choose({ windows: 'doppler.exe', linux: '/doppler' });
        if (this.getLocation().indexOf(executableMarker) !== -1) {
            return this._isInstalled = true;
        }
        return false;
    }
    /**
     * Returns true if the local doppler cli is logged in
     */
    get isLoggedIn() {
        try {
            // Check if email is configured
            const test = childProcess
                .execSync('doppler projects', { stdio: 'pipe' })
                .toString('utf8').trim();
            return test !== "Doppler Error: you must provide a token";
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Login the user into doppler
     *
     * @arg timeout Timeout in seconds to keep the doppler login alive
     *
     * @return number Returns 1 if successfully logged in, 0 if not and -1 if a timeout did occur
     */
    login(timeout) {
        try {
            childProcess
                .execSync('doppler login --scope "/" --overwrite --yes', { timeout: timeout * 1000 });
        }
        catch (e) {
            if (e.code && e.code === "ETIMEDOUT") {
                return -1;
            }
        }
        return this.isLoggedIn ? 1 : 0;
    }
    /**
     * Creates a new Doppler project
     */
    createProject(projectName) {
        childProcess.execSync('doppler projects create "' + projectName + '" --json', { stdio: 'pipe' });
    }
    /**
     * Creates a new environment in an existing Doppler project
     */
    /**
     * Checks if a Doppler project exists
     */
    projectExists(projectName) {
        try {
            childProcess.execSync('doppler projects get -p "' + projectName + '" --json', { stdio: 'pipe' });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Deletes an existing Doppler project
     */
    deleteProject(projectName) {
        childProcess.execSync('doppler projects delete -p "' + projectName + '" --yes', { stdio: 'pipe' });
    }
    createEnvironment(projectName, envName, slug) {
        const envSlug = slug || envName;
        childProcess.execSync('doppler environments create "' + envName + '" "' + envSlug + '" -p "' + projectName + '" --json', { stdio: 'pipe' });
    }
    /**
     * Sets one or more secrets in a Doppler project config
     */
    setSecrets(projectName, configName, secrets) {
        const pairs = Object.entries(secrets)
            .map(([key, value]) => '"' + key + '=' + value + '"')
            .join(' ');
        childProcess.execSync('doppler secrets set ' + pairs + ' -p "' + projectName + '" -c "' + configName + '"', { stdio: 'pipe' });
    }
    checkIfValidServiceTokenExists(dopplerProject, dopplerConfig) {
        const ownTokens = this._getServiceTokens(dopplerProject, dopplerConfig)
            .filter(token => token.name === (this._context.platform.hostname() + ".dev"));
        return ownTokens !== null && ownTokens.length > 0;
    }
    generateServiceToken(dopplerProject, dopplerConfig) {
        this._revokeServiceTokensIfRquired(dopplerProject, dopplerConfig);
        const serviceToken = childProcess
            .execSync('doppler configs tokens create "' + (this._context.platform.hostname() + '.dev') + '" -p "' + dopplerProject + '" -c "' + dopplerConfig + '" --plain --max-age 96h')
            .toString('utf8')
            .trim();
        if (serviceToken.indexOf('dp.st.' + dopplerConfig) !== 0) {
            throw new Error('The doppler service token could not be created!');
        }
        return serviceToken;
    }
    _getServiceTokens(dopplerProject, dopplerConfig) {
        const tokens = JSON.parse(childProcess
            .execSync('doppler configs tokens -p "' + dopplerProject + '" -c "' + dopplerConfig + '" --json', { stdio: 'pipe' })
            .toString('utf8')
            .trim());
        if (tokens === null)
            return [];
        return tokens;
    }
    _revokeServiceTokensIfRquired(dopplerProject, dopplerConfig) {
        this._getServiceTokens(dopplerProject, dopplerConfig)
            .filter(token => token.name === (this._context.platform.hostname() + ".dev"))
            .map(token => {
            childProcess
                .execSync('doppler configs tokens revoke "' + token.slug + '" -p "' + dopplerProject + '" -c "' + dopplerConfig + '"', { stdio: 'pipe' });
        });
    }
}
exports.Doppler = Doppler;
//# sourceMappingURL=Doppler.js.map