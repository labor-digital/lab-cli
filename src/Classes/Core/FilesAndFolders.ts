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
 * Last modified: 2020.04.05 at 23:44
 */
import * as fs from 'fs';
import * as path from 'path';

export class FilesAndFolders
{
    
    /**
     * Helper to recursively delete a directory with contents
     * @param dirname The dirname to the directory to delete
     * @param removeSelf If set to false, the parent directory will not be removed
     */
    static rmdirRecursive(dirname: string, removeSelf?: boolean)
    {
        if (fs.existsSync(dirname)) {
            fs.readdirSync(dirname).forEach(function (file, index) {
                var curPath = dirname + path.sep + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    module.exports.rmdirRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            if (removeSelf !== false) {
                fs.rmdirSync(dirname);
            }
        }
    }
    
    /**
     * Generates a directory recursively
     * @see https://gist.github.com/bpedro/742162#gistcomment-828133
     * @param directory The directory to create
     */
    static mkdirRecursive(directory: string): void
    {
        var parts = directory.replace(/[\\\/]/g, '/').replace(/\/$/, '').split('/');
        
        for (var i = 1; i <= parts.length; i++) {
            var segment = parts.slice(0, i).join('/');
            if (segment === '' || segment === undefined) {
                continue;
            }
            !fs.existsSync(segment) ? fs.mkdirSync(segment) : null;
        }
    }
}