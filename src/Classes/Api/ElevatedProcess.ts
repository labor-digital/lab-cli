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
 * Last modified: 2020.04.05 at 19:34
 */

import {asArray, List} from '@labor-digital/helferlein';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {AppContext} from '../Core/AppContext';

export class ElevatedProcess
{
    
    /**
     * The app context to run the process with
     */
    protected _context: AppContext;
    
    /**
     * Elevated Process constructor
     * @param context
     */
    public constructor(context: AppContext)
    {
        this._context = context;
    }
    
    /**
     * Executes a single command as an elevated process
     * @param cmd A valid command to be executed
     * @param keepOpen True to keep the window open after it executed -> Windows only
     * @returns {*}
     */
    public exec(cmd: string, keepOpen?: boolean): any
    {
        return this._context.platform.choose({
            windows: () => {
                var elevatePath = this.getWindowsExecutablePath();
                const quoteCommand = cmd.indexOf('"') === -1;
                if (quoteCommand) {
                    cmd = '"' + cmd + '"';
                }
                let options = '-w ' + (keepOpen ? '-k' : '-c');
                var command = '"' + elevatePath + '" ' + options + ' ' + cmd;
                return childProcess.execSync(command, {'stdio': 'inherit'});
            },
            linux: () => {
                const command = 'sudo ' + cmd;
                return childProcess.execSync(command, {'stdio': 'inherit'});
            }
        })();
    }
    
    /**
     * Executes multiple commands as single elevated process
     * @param cmdList And array of commands to be executed in their given order
     */
    public execMultiple(cmdList: List)
    {
        // Check if the list is an array
        if (typeof cmdList.forEach !== 'function') {
            throw new Error('The command list has to be an array');
        }
        
        // Build the bat file
        var content = asArray(cmdList).join('\n');
        
        // Write the content
        const executionFile = this._context.platform.choose({
            windows: () => this._context.platform.tempDirectory + '\\elevatedMultiCommand.bat',
            linux: () => {
                // Add shebang to content
                content = '#!/bin/sh\n' + content;
                return this._context.platform.tempDirectory + '/elevatedMultiCommand.sh';
            }
        })();
        fs.writeFileSync(executionFile, content);
        
        // Make sure the file has the correct permissions
        this._context.platform.choose({
            windows: () => {
            },
            linux: () => {
                fs.chmodSync(executionFile, 0o777);
            }
        })();
        
        // Execute the bat
        this.exec(executionFile);
        
        // Remove the bat again
        fs.unlinkSync(executionFile);
    }
    
    /**
     * Returns the absolute file path to the windows elevator script
     */
    protected getWindowsExecutablePath(): string
    {
        return path.join(__dirname, '../../../', 'bin/elevate/bin.x86-' +
                                                 (this._context.platform.is64Bit() ? '64' : '32') + '/elevate.exe');
    }
}