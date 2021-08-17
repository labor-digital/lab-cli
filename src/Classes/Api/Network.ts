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
import {escapeRegex} from '@labor-digital/helferlein';
import * as childProcess from 'child_process';
import {AppContext} from '../Core/AppContext';

export class Network
{
    protected _context: AppContext;
    
    constructor(context: AppContext)
    {
        this._context = context;
    }
    
    /**
     * Currently only used in darwin to check if a loopback is registered for the
     * given ip address, or has to be registered in order for the app to work correctly
     * @param ip
     */
    public registerLoopBackAliasIfRequired(ip: string): void
    {
        if (this._context.platform.isDarwin) {
            console.log('Check if loopback adapter is set up correctly to handle ip: ' + ip);
            const pattern = new RegExp(escapeRegex(ip) + ' netmask', 'm');
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
