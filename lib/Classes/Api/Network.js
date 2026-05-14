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
 * Last modified: 2020.09.11 at 14:28
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
exports.Network = void 0;
const childProcess = __importStar(require("child_process"));
class Network {
    constructor(context) {
        this._context = context;
    }
    /**
     * Currently only used in darwin to check if a loopback is registered for the
     * given ip address, or has to be registered in order for the app to work correctly
     * @param ip
     */
    registerLoopBackAliasIfRequired(ip) {
        if (this._context.platform.isDarwin) {
            console.log('Check if loopback adapter is set up correctly to handle ip: ' + ip);
            const pattern = new RegExp(ip.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + ' netmask', 'm');
            if (childProcess.execSync('ifconfig lo0').toString('utf-8').match(pattern)) {
                console.log('Loopback for: ' + ip + ' is set up correctly!');
                return;
            }
            console.log('A loopback must be registered to handle ip:' + ip + ', this requires root permissions!');
            childProcess.execSync('sudo ifconfig lo0 alias ' + ip);
            if (childProcess.execSync('ifconfig lo0').toString('utf-8').match(pattern)) {
                console.log('Loopback setup successful!');
                return;
            }
            throw new Error('Could not set up the loopback adapter for ip: ' + ip);
        }
    }
}
exports.Network = Network;
//# sourceMappingURL=Network.js.map