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
 * Last modified: 2020.04.05 at 20:17
 */

import chalk from 'chalk';
import {Command} from 'commander';
import {Docker} from '../Api/Docker';
import {AppContext} from '../Core/AppContext';

export class DockerEngineStopCommand
{
    public execute(cmd: Command, context: AppContext): Promise<void>
    {
        const api = new Docker(context);
        if (!api.isRunning && cmd.force !== true) {
            console.log(chalk.yellowBright('The docker engine is currently not running!'));
            return Promise.resolve();
        }
        return api.stopEngine(cmd.force);
    }
}