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
 * Last modified: 2020.04.04 at 12:48
 */
import {forEach} from '@labor-digital/helferlein/lib/Lists/forEach';
import {isNull} from '@labor-digital/helferlein/lib/Types/isNull';
import * as fs from 'fs';
import * as path from 'path';
import {AppContext} from './AppContext';
import {DockerApp} from './DockerApp/DockerApp';

export class FileFinder
{
    
    /**
     * Searches a valid root directory to look up other files and directories with
     * @param context
     */
    public findRootDirectory(context: AppContext): string
    {
        let rootDirectory: string | null = null;
        
        // Build the lookup list for all docker related files
        forEach(DockerApp.dockerComposeRootFiles, (file: string) => {
            rootDirectory = this.findFileInCwd(context, file);
            if (isNull(rootDirectory)) {
                return;
            }
            return false;
        });
        
        // Try to find package.json if we did not find a docker file
        if (isNull(rootDirectory)) {
            rootDirectory = this.findFileInCwd(context, 'package.json');
        }
        
        // Try to find a app config file if we still have nothing
        if (isNull(rootDirectory)) {
            rootDirectory = this.findFileInCwd(context, 'lab.config.json');
        }
        
        // Return the current working directory if we did not find a root directory
        if (isNull(rootDirectory)) {
            return context.cwd;
        }
        return rootDirectory + path.sep;
    }
    
    /**
     * Tries to find the package json file path based on the given context
     * @param context
     */
    public findPackageJson(context: AppContext): string | null
    {
        // Check if there is an src directory
        let packageJson = path.join(context.rootDirectory, 'src', 'package.json');
        if (fs.existsSync(packageJson)) {
            return packageJson;
        }
        
        // Check if we can find it in the root directory
        packageJson = path.join(context.rootDirectory, 'package.json');
        if (fs.existsSync(packageJson)) {
            return packageJson;
        }
        
        // Check if we can find it in the cwd
        return path.join(this.findFileInCwd(context, 'package.json'), 'package.json');
    }
    
    /**
     * Tries to find a file with a given name in the current working directory by traversing upwards through the structure
     * @param context
     * @param filename
     */
    protected findFileInCwd(context: AppContext, filename: string): string | null
    {
        const cwdParts = context.cwd.split(/[\/\\]/g);
        const minDepth = context.platform.isWindows ? 1 : 0;
        const pathPrefix = context.platform.isWindows ? '' : path.sep;
        while (cwdParts.length > minDepth) {
            cwdParts.pop();
            let pathLocal = pathPrefix + path.join(...cwdParts);
            if (context.platform.isWindows && cwdParts.length === 1) {
                pathLocal =
                    pathLocal.substr(0, pathLocal.length - 1) + path.sep;
            }
            const lookupFile = path.join(pathLocal, filename);
            if (!fs.existsSync(lookupFile)) {
                continue;
            }
            return pathLocal;
        }
        return null;
    }
    
}
