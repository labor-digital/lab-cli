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
exports.DockerHosts = void 0;
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
 * Last modified: 2020.04.06 at 09:06
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ElevatedProcess_1 = require("../../Api/ElevatedProcess");
class DockerHosts {
    /**
     * DockerHosts constructor
     * @param context
     */
    constructor(context) {
        this._context = context;
        this._filename = this._context.config.get('network.hostsFilePath');
        this._isDirty = false;
        this.read();
    }
    /**
     * Creates/updates a hosts file line for a given app name
     * @param ip The ip address to register
     * @param domain The domain to register the ip address for
     */
    set(ip, domain) {
        let updateHappened = false;
        const rootDirectory = this._context.rootDirectory;
        // Check if there is a domain conflict
        this._domains.forEach((d, k) => {
            if (d === domain) {
                const dRootDirectory = this._directories.get(k);
                if (dRootDirectory !== rootDirectory) {
                    if (!(dRootDirectory === undefined)) {
                        throw new Error('Hosts file conflict: The domain ' + domain +
                            ' was already registered with another app at: ' + dRootDirectory + '!');
                    }
                    else {
                        throw new Error('Hosts file conflict: The domain ' + domain + ' is already in your hosts file!');
                    }
                }
                // Match on the same app -> check if ip matches
                const dIp = this._ips.get(k);
                if (ip === dIp) {
                    // This set is already known, ignore the input
                    updateHappened = true;
                }
                else {
                    // Update the ip address for this domain
                    this._ips.set(k, ip);
                    updateHappened = true;
                    this._isDirty = true;
                }
            }
        });
        // Check if we could update an existing set -> otherwise add a new line
        if (!updateHappened) {
            const newLineKey = this._tpl.size + 1;
            this._tpl.set(newLineKey, '{ip} {domain}');
            this._ips.set(newLineKey, ip);
            this._domains.set(newLineKey, domain);
            this._directories.set(newLineKey, rootDirectory);
            this._isDirty = true;
        }
    }
    /**
     * Removes a single domain from the hosts setup
     * @param domain
     */
    removeDomain(domain) {
        (0, ForEachHelper_1.forEach)(this._domains, (_domain, k) => {
            if (_domain !== domain) {
                return;
            }
            this._tpl.delete(k);
            this._ips.delete(k);
            this._domains.delete(k);
            this._directories.delete(k);
            this._isDirty = true;
        });
        return this;
    }
    /**
     * Removes the hosts entry for the current app
     */
    removeCurrent() {
        (0, ForEachHelper_1.forEach)(this._directories, (dir, k) => {
            if (dir !== this._context.rootDirectory) {
                return;
            }
            this._tpl.delete(k);
            this._ips.delete(k);
            this._domains.delete(k);
            this._directories.delete(k);
            this._isDirty = true;
        });
        return this;
    }
    /**
     * Dumps the memory lists to the hosts file
     */
    write() {
        if (!this._isDirty) {
            return this;
        }
        // Stringify the file
        const lines = [];
        this._tpl.forEach((t, k) => {
            const ip = this._ips.get(k);
            // Fastlane for empty lines
            if (typeof ip === 'undefined') {
                lines.push(t);
                return;
            }
            // Build base line
            const domain = this._domains.get(k);
            let line = t.replace(/{ip}/, ip);
            if (!this._directories.has(k)) {
                lines.push(line.replace(/{domain}/, domain));
            }
            else {
                lines.push(line.replace(/{domain}/, domain + ' #lab-docker-app ' + this._directories.get(k)));
            }
        });
        const content = lines.join('\n');
        const tmpFile = path.join(this._context.platform.tempDirectory, 'lab-tmp-hosts.txt');
        fs.writeFileSync(tmpFile, content);
        this._isDirty = false;
        // Copy the hosts to the destination using elevation
        (new ElevatedProcess_1.ElevatedProcess(this._context)).execMultiple([
            this._context.platform.choose({ windows: 'copy /Y', linux: 'cp' }) +
                ' "' + tmpFile + '" "' + this._filename + '"'
        ]);
    }
    /**
     * Reads the contents of the hosts file into the memory lists
     */
    read() {
        if (!fs.existsSync(this._filename)) {
            throw new Error('Could not find hosts file at: "' + this._filename + '"!');
        }
        const lines = fs.readFileSync(this._filename).toString('utf-8').split(/\r?\n/g);
        this._tpl = new Map();
        this._ips = new Map();
        this._domains = new Map();
        this._directories = new Map();
        let c = -1;
        lines.forEach(line => {
            c++;
            // Skip commented lines
            if (line.trim().charAt(0) === '#' || line.trim().length === 0) {
                this._tpl.set(c, line);
                return;
            }
            this._tpl.set(c, line.replace(/^([\s\t]*?)([^\s]*)([\s\t]*)([^\s]*)(\s#lab-docker-app\s)?(.*?$)/, (a, before, ip, between, domain, appMarker, appName) => {
                this._ips.set(c, ip);
                this._domains.set(c, domain);
                let after = appName;
                if (typeof appMarker === 'string') {
                    this._directories.set(c, appName.trim());
                    after = '';
                }
                return before + '{ip}' + between + '{domain}' + after;
            }));
        });
    }
}
exports.DockerHosts = DockerHosts;
//# sourceMappingURL=DockerHosts.js.map