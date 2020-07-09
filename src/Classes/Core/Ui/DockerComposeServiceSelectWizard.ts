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
 * Last modified: 2020.04.06 at 09:55
 */

import {PlainObject} from '@labor-digital/helferlein/lib/Interfaces/PlainObject';
import {forEach} from '@labor-digital/helferlein/lib/Lists/forEach';
import {getPath} from '@labor-digital/helferlein/lib/Lists/Paths/getPath';
import {isString} from '@labor-digital/helferlein/lib/Types/isString';
import {isUndefined} from '@labor-digital/helferlein/lib/Types/isUndefined';
import inquirer from 'inquirer';
import {DockerCompose} from '../../Api/DockerCompose';
import {Bugfixes} from '../Bugfixes';

export class DockerComposeServiceSelectWizard
{
    
    /**
     * Runs the wizard
     * @param dockerCompose the docker compose api
     * @param forWhat A string that describes for what the service should be used
     * @param suggestedServiceKey An optional service key to use by default
     * @param currentContainerName
     */
    public static run(
        dockerCompose: DockerCompose,
        forWhat: string,
        suggestedServiceKey?: string,
        currentContainerName?: string
    ): Promise<string>
    {
        // Make sure to update the suggested service key when we got a container name
        if (isString(currentContainerName)) {
            const newSuggestedServiceKey = DockerComposeServiceSelectWizard
                .convertCurrentContainerNameToServiceKey(dockerCompose, currentContainerName);
            if (isString(newSuggestedServiceKey)) {
                suggestedServiceKey = newSuggestedServiceKey;
            }
        }
        
        // Ask
        return inquirer.prompt([
            {
                name: 'ok',
                when: () => isString(suggestedServiceKey) &&
                            DockerComposeServiceSelectWizard.checkIfSuggestionExists(dockerCompose,
                                suggestedServiceKey),
                type: 'confirm',
                message: 'I will use the service: "' + suggestedServiceKey + '" to ' + forWhat + '. Ok?'
            },
            {
                name: 'target',
                message: 'Which service should I use to ' + forWhat + '?',
                when: answers => !answers.ok || isUndefined(answers.ok),
                type: 'list',
                choices: DockerComposeServiceSelectWizard.buildServiceOptions(dockerCompose)
            }
        ]).then(answers => {
            Bugfixes.inquirerChildProcessReadLineFix();
            if (answers.ok) {
                return Promise.resolve(
                    DockerComposeServiceSelectWizard.convertServiceKeyToContainerName(dockerCompose,
                        suggestedServiceKey)
                );
            }
            return Promise.resolve(answers.target);
        });
    }
    
    /**
     * Converts the list of docker-compose services in a option array for inquirer
     * @param dockerCompose
     */
    protected static buildServiceOptions(dockerCompose: DockerCompose): Array<PlainObject>
    {
        const services = dockerCompose.getServiceList();
        const options: Array<PlainObject> = [];
        forEach(services, (service: PlainObject) => {
            options.push({
                name: service.key,
                value: service.containerName
            });
        });
        return options;
    }
    
    /**
     * Checks if the suggested service key exists in the list of keys
     * @param dockerCompose
     * @param suggestedServiceKey
     */
    protected static checkIfSuggestionExists(dockerCompose: DockerCompose, suggestedServiceKey: string): boolean
    {
        const services = dockerCompose.getServiceList();
        const serviceKeys = getPath(services, '*.key');
        return serviceKeys.indexOf(suggestedServiceKey) !== -1;
    }
    
    /**
     * Converts the given current container name to a service key
     * @param dockerCompose
     * @param containerName
     */
    protected static convertCurrentContainerNameToServiceKey(
        dockerCompose: DockerCompose,
        containerName: string
    ): string | undefined
    {
        const services = dockerCompose.getServiceList();
        let serviceKey = undefined;
        forEach(services, (service: PlainObject) => {
            if (service.containerName !== containerName) {
                return;
            }
            serviceKey = service.key;
            return false;
        });
        return serviceKey;
    }
    
    /**
     * Converts a service key to a container name
     * @param dockerCompose
     * @param serviceKey
     */
    protected static convertServiceKeyToContainerName(dockerCompose: DockerCompose, serviceKey: string): string
    {
        const services = dockerCompose.getServiceList();
        let containerName = undefined;
        forEach(services, (service: PlainObject) => {
            if (service.key !== serviceKey) {
                return;
            }
            containerName = service.containerName;
            return false;
        });
        if (!isString(containerName)) {
            throw new Error(
                'Failed to convert serviceKey: ' + serviceKey + ' to a container name!');
        }
        return containerName;
    }
}