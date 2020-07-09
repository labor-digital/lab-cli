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
 * Last modified: 2020.04.06 at 14:38
 */

import {getPath} from '@labor-digital/helferlein/lib/Lists/Paths/getPath';
import chalk from 'chalk';
import {Command} from 'commander';
// @ts-ignore
import * as yaml from 'yamljs';
import {Unison} from '../Api/Unison';
import {AppContext} from '../Core/AppContext';
import {DockerApp} from '../Core/DockerApp/DockerApp';

export class DockerComposeUnisonCommand
{
    
    public execute(cmd: Command, context: AppContext): Promise<void>
    {
        return (new DockerApp(context)).initialize().then(app => {
            const services = app.dockerCompose.getServiceList();
            const serviceKeys = getPath(services, '*.key');
            if (serviceKeys.indexOf('docker-unison') == -1) {
                return this.migrateDockerCompose(app);
            }
            return Unison.startUnison(app, cmd.force);
        });
    }
    
    /**
     * Displays the migration template
     * @param app
     */
    protected migrateDockerCompose(app: DockerApp): Promise<void>
    {
        console.log('It looks like your project is currently not set up to run with unison...');
        
        // Show some descriptive text
        console.log(`This setup is required to work with unison on your container:
===============================================================
To perform it manually, open your app's docker compose file: "${app.dockerComposeFile}".
1. Find your app's main service in the "services" list. It is probably has the key: "${app.serviceKey}"
2. Check if there is a "volumes" key inside the definition.
3. If so, check if there are "mounted volumes" to the following directory "${app.context.config.get(
            'unison.migration.targetVolume')}"
   -> A mounted volume looks like: /path/on/host:/path/in/container or like an object defining "source" and "target"
4. If there are mounted volumes, remove the "host-path" (replace the object with the string: "${app.context.config.get(
            'unison.migration.targetVolume')}").
5. Add the following definition into your list of services:`);
        
        // Build the template
        const targetPort = app.context.config.get('unison.target.port', 5000);
        const definition = app.context.config.get('unison.migration.definition');
        definition.depends_on.push(app.serviceKey);
        definition.volumes_from.push(app.serviceKey);
        definition.ports.push('${APP_IP}:' + targetPort + ':5000/tcp');
        let tpl = yaml.stringify(definition).split(/\r?\n/g)
                      .map((v: string) => '      ' + v).join('\n');
        console.log(`  services:
    docker-unison:`);
        console.log(tpl);
        console.log(chalk.yellowBright('Scroll up a bit...'));
        return Promise.resolve();
    }
}