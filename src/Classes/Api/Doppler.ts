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

import * as childProcess from 'child_process';
import {AppContext} from '../Core/AppContext';

export class Doppler
{
    /**
     * The context object of this docker api instance
     */
    protected _context: AppContext;
    
    /**
     * Contains true if git is installed on the system, or null
     */
    protected _isInstalled: boolean | null;
    
    /**
     * Docker Constructor
     * @param context
     */
    public constructor(context: AppContext)
    {
        this._context = context;
        this._isInstalled = null;
    }
    
    /**
     * Returns git's install location or an empty string
     */
    public getLocation(): string
    {
        try {
            return childProcess.execSync(
                this._context.platform.choose({
                    windows: 'WHERE doppler',
                    linux: 'which doppler'
                }), {'stdio': 'pipe'})
                               .toString('utf8').replace(/(\r?\n)+(.*)$/gm, '');
        } catch (e) {
            return '';
        }
    }
    
    /**
     * Returns true if git is installed on the machine
     */
    public isInstalled(): boolean
    {
        if (this._isInstalled === true) {
            return true;
        }
        const executableMarker: string = this._context.platform.choose({windows: 'doppler.exe', linux: '/doppler'});
        if (this.getLocation().indexOf(executableMarker) !== -1) {
            return this._isInstalled = true;
        }
        return false;
    }
    
    /**
     * Returns true if the local doppler cli is logged in
     */
    public get isLoggedIn(): boolean
    {
        try {
            // Check if email is configured
            const test = childProcess
                .execSync('doppler projects', {stdio: 'pipe'})
                .toString('utf8').trim();
            
            return test !== "Doppler Error: you must provide a token";
        } catch (e) {
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
    public login(timeout: number): number
    {
        try {
            childProcess
                .execSync('doppler login --scope "/" --overwrite --yes', {timeout: timeout*1000});
        } catch (e) {
            if (e.code && e.code === "ETIMEDOUT") {
                return -1;
            }
        }
        return this.isLoggedIn ? 1 : 0;
    }
    
    public checkIfValidServiceTokenExists(dopplerProject: string, dopplerConfig: string): boolean
    {
        const ownTokens = this._getServiceTokens(dopplerProject, dopplerConfig)
            .filter(token => token.name === (this._context.hostname + ".dev"));
        
        return ownTokens !== null && ownTokens.length > 0;
    }
    
    public generateServiceToken(dopplerProject: string, dopplerConfig: string): string
    {
        this._revokeServiceTokensIfRquired(dopplerProject, dopplerConfig);
        
        const serviceToken = childProcess
            .execSync('doppler configs tokens create "' + (this._context.hostname + '.dev') + '" -p "' + dopplerProject + '" -c "' + dopplerConfig + '" --plain --max-age 96h')
            .toString('utf8')
            .trim();
        
        if (serviceToken.indexOf('dp.st.' + dopplerConfig) !== 0) {
            throw new Error('The doppler service token could not be created!');
        }
        
        return serviceToken;
    }
    
    protected _getServiceTokens(dopplerProject: string, dopplerConfig: string): Array<any>
    {
        const tokens = JSON.parse(
            childProcess
                .execSync('doppler configs tokens -p "' + dopplerProject + '" -c "' + dopplerConfig + '" --json', {stdio: 'pipe'})
                .toString('utf8')
                .trim()
        );
        
        if (tokens === null)
            return [];
        
        return tokens;
    }
    
    protected _revokeServiceTokensIfRquired(dopplerProject: string, dopplerConfig: string)
    {
        this._getServiceTokens(dopplerProject, dopplerConfig)
            .filter(token => token.name === (this._context.hostname + ".dev"))
            .map(token => {
                childProcess
                    .execSync('doppler configs tokens revoke "' + token.slug + '" -p "' + dopplerProject + '" -c "' + dopplerConfig + '"', {stdio: 'pipe'});
            });
    }
    
}