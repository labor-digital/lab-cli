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

import {PlainObject} from '@labor-digital/helferlein/lib/Interfaces/PlainObject';
import * as childProcess from 'child_process';
import {AppContext} from '../Core/AppContext';

export class Git
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
                    windows: 'WHERE git',
                    linux: 'which git'
                }), {'stdio': 'pipe'})
                               .toString('utf8').replace(/[\r\n]+(.*)$/gm, '');
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
        const executableMarker: string = this._context.platform.choose({windows: 'git.exe', linux: '/git'});
        if (this.getLocation().indexOf(executableMarker) !== -1) {
            return this._isInstalled = true;
        }
        return false;
    }
    
    /**
     * Returns true if the basic git user configuration has been done correctly
     */
    public hasConfiguredUser(): boolean
    {
        try {
            // Check if email is configured
            childProcess.execSync('git config --get user.email')
                        .toString('utf8').replace(/\r?\n/g, '');
            // Check if user name is configured
            childProcess.execSync('git config --get user.name')
                        .toString('utf8').replace(/\r?\n/g, '');
            // All set up
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Configures the git user with the given email address and name
     */
    public configureUser(email: string, name: string): Git
    {
        const command1 = 'git config --global user.email "' + email + '"';
        childProcess.execSync(command1);
        const command2 = 'git config --global user.name "' + name + '"';
        childProcess.execSync(command2);
        return this;
    }
    
    /**
     * Executes a synchronous git clone command
     * @param repositoryUrl The git repository url to clone
     * @param target The local path to clone the repository to
     */
    public clone(repositoryUrl: string, target: string): Git
    {
        const command = 'git clone ' + repositoryUrl + ' "' + target + '"';
        childProcess.execSync(command, {stdio: 'inherit'});
        return this;
    }
    
    /**
     * Returns a list of all (remote) branches in the git repository which resides in the given target directory
     * @param target The local path of the repository to read the branches from
     * @param skipPullRequests If true all branches starting with "pr-" will be ignored
     */
    public getRemoteBranches(target: string, skipPullRequests?: boolean): PlainObject<string>
    {
        const command = this._context.platform.choose({
            windows: 'cd /d "' + target + '" && git branch -a --color=never',
            linux: 'cd "' + target + '" && git branch -a --color=never'
        });
        
        const branchesRaw = childProcess.execSync(command, {'stdio': 'pipe'}).toString('utf-8');
        const branches: PlainObject<string> = {};
        branchesRaw.split(/\r?\n/g).forEach(line => {
            line = line.trim();
            if (line.indexOf('remotes/origin') !== 0) {
                return;
            }
            if (line.indexOf('->') !== -1) {
                return;
            }
            const branch = line.replace(/^.*\//, '');
            if (branch === 'master') {
                return;
            }
            if (skipPullRequests === true && branch.indexOf('pr-') === 0) {
                return;
            }
            const branchName: Array<string> = [];
            branch.split(/-/g).forEach(part => {
                branchName.push(part.charAt(0).toUpperCase() + part.substr(1));
            });
            branches[branch] = branchName.join(' ');
        });
        return branches;
    }
    
    /**
     * Can be used to checkout a given branch in the target directory
     * @param target The local path of the repository to check a branch out
     * @param branch the name of the branch to check out
     */
    public checkoutBranch(target: string, branch: string): Git
    {
        let command = this._context.platform.choose({windows: 'cd /d ', linux: 'cd '}) +
                      '"' + target + '" && git checkout "' + branch + '"';
        childProcess.execSync(command, {'stdio': 'pipe'});
        return this;
    }
    
    /**
     * Is used to initialize a new git repository at the given location
     * All files in the directory will be added to the repository and an initial commit is created
     * @param target The absolute path where to initialize the repository at
     */
    public initializeRepo(target: string): Git
    {
        const command = this._context.platform.choose({windows: 'cd /d ', linux: 'cd '}) +
                        ' "' + target + '" && git init && ' +
                        'git add ./ && ' +
                        'git commit -a -m "Initial commit"';
        childProcess.execSync(command);
        return this;
    }
    
    /**
     * Adds all files in a given directory to git's staged files
     * @param directory
     */
    public stageFilesInDirectory(directory: string): Git
    {
        const command = this._context.platform.choose({windows: 'cd /d ', linux: 'cd '}) +
                        '"' + directory + '" && git add .';
        childProcess.execSync(command);
        return this;
    }
    
    /**
     * Prints all changed/staged files in the current git repository to the console
     * @param directory
     */
    public printAllStagedFiles(directory: string): Git
    {
        const command = this._context.platform.choose({windows: 'cd /d ', linux: 'cd '}) +
                        '"' + directory + '" && git diff --name-only --cached';
        childProcess.execSync(command, {'stdio': 'inherit'});
        return this;
    }
    
    /**
     * Pushes the local repository to the origin remote
     * @param directory
     */
    public push(directory: string): Git
    {
        const command = this._context.platform.choose({windows: 'cd /d ', linux: 'cd '}) +
                        '"' + directory + '" && git push --set-upstream origin master';
        childProcess.execSync(command, {'stdio': 'inherit'});
        return this;
    }
}