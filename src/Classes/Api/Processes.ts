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
 * Last modified: 2020.04.05 at 20:26
 */
import * as childProcess from 'child_process';

/**
 * @todo this class will fail on linux and darwin!
 */
export class Processes
{
    
    /**
     * Receives a title of a window and tries to close all of it's occurrences.
     * A title might be something like "Docker: my-project-app-tag - C:\Start\Bat\path.cmd"
     * @param title The exact title of the window to close
     */
    static closeWindowWithTitle(title: string): Promise<any>
    {
        return Processes.killByFilter('Windowtitle eq ' + title + '*');
    }
    
    /**
     * Receives a task list filter like "IMAGENAME eq something*" to stop all processes that match
     * @param filter
     */
    static killByFilter(filter: string): Promise<any>
    {
        return (new Promise(resolve => {
            const command = 'tasklist /FO CSV /FI "' + filter + '"';
            childProcess.exec(command, (foo, result) => {
                resolve(result.split(/\r?\n/gi));
            });
        })).then((rows: Array<string>) => {
            const promises: any = [];
            const result: any = [];
            rows.forEach(row => {
                promises.push(new Promise((resolve, reject) => {
                    const rowParts = row.split(',');
                    
                    // Check if we can find the pid
                    if (typeof rowParts[1] !== 'string') {
                        return resolve(false);
                    }
                    if (rowParts[1].indexOf('"') !== 0) {
                        return resolve(false);
                    }
                    if (!rowParts[1].match(/[0-9]+/)) {
                        return resolve(false);
                    }
                    
                    // Kill the process
                    try {
                        childProcess.exec('taskkill /F /T /pid ' + rowParts[1], () => {
                            result.push(rowParts[1]);
                            resolve(rowParts[1]);
                        });
                    } catch (e) {
                        reject('Failed closing window with pid: ' + rowParts[1]);
                    }
                }));
            });
            return Promise.all(promises).then(() => Promise.resolve(result)).then(() => {
                return new Promise<void>(resolve => {
                    setTimeout(() => resolve(), 500);
                });
            });
        });
    }
}