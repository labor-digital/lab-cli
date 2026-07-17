"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeServiceSelectWizard = void 0;
const ForEachHelper_1 = require("../Utils/ForEachHelper");
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
const radashi_1 = require("radashi");
const inquirer_1 = __importDefault(require("inquirer"));
const Bugfixes_1 = require("../Bugfixes");
class DockerComposeServiceSelectWizard {
    /**
     * Runs the wizard
     * @param dockerCompose the docker compose api
     * @param forWhat A string that describes for what the service should be used
     * @param suggestedServiceKey An optional service key to use by default
     * @param currentContainerName
     */
    static run(dockerCompose, forWhat, suggestedServiceKey, currentContainerName, acceptDefaults = false) {
        // Make sure to update the suggested service key when we got a container name
        if ((0, radashi_1.isString)(currentContainerName)) {
            const newSuggestedServiceKey = DockerComposeServiceSelectWizard
                .convertCurrentContainerNameToServiceKey(dockerCompose, currentContainerName);
            if ((0, radashi_1.isString)(newSuggestedServiceKey)) {
                suggestedServiceKey = newSuggestedServiceKey;
            }
        }
        // Auto-accept the suggested service key if acceptDefaults is set
        if (acceptDefaults && (0, radashi_1.isString)(suggestedServiceKey) &&
            DockerComposeServiceSelectWizard.checkIfSuggestionExists(dockerCompose, suggestedServiceKey)) {
            console.log('Using default service: "' + suggestedServiceKey + '"');
            return Promise.resolve(DockerComposeServiceSelectWizard.convertServiceKeyToContainerName(dockerCompose, suggestedServiceKey));
        }
        // If acceptDefaults but no valid suggestion, pick the first service
        if (acceptDefaults) {
            const services = dockerCompose.getServiceList();
            if (services.length > 0) {
                const first = services[0];
                console.log('Using first available service: "' + first.key + '"');
                return Promise.resolve(first.containerName);
            }
        }
        // Ask
        return inquirer_1.default.prompt([
            {
                name: 'ok',
                when: () => (0, radashi_1.isString)(suggestedServiceKey) &&
                    DockerComposeServiceSelectWizard.checkIfSuggestionExists(dockerCompose, suggestedServiceKey),
                type: 'confirm',
                message: 'I will use the service: "' + suggestedServiceKey + '" to ' + forWhat + '. Ok?'
            },
            {
                name: 'target',
                message: 'Which service should I use to ' + forWhat + '?',
                when: answers => !answers.ok || (answers.ok === undefined),
                type: 'select',
                choices: DockerComposeServiceSelectWizard.buildServiceOptions(dockerCompose)
            }
        ]).then(answers => {
            Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
            if (answers.ok) {
                return Promise.resolve(DockerComposeServiceSelectWizard.convertServiceKeyToContainerName(dockerCompose, suggestedServiceKey));
            }
            return Promise.resolve(answers.target);
        });
    }
    /**
     * Converts the list of docker compose services in a option array for inquirer
     * @param dockerCompose
     */
    static buildServiceOptions(dockerCompose) {
        const services = dockerCompose.getServiceList();
        const options = [];
        (0, ForEachHelper_1.forEach)(services, (service) => {
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
    static checkIfSuggestionExists(dockerCompose, suggestedServiceKey) {
        const services = dockerCompose.getServiceList();
        const serviceKeys = (0, radashi_1.get)(services, '*.key', []);
        return serviceKeys.indexOf(suggestedServiceKey) !== -1;
    }
    /**
     * Converts the given current container name to a service key
     * @param dockerCompose
     * @param containerName
     */
    static convertCurrentContainerNameToServiceKey(dockerCompose, containerName) {
        const services = dockerCompose.getServiceList();
        let serviceKey = undefined;
        (0, ForEachHelper_1.forEach)(services, (service) => {
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
    static convertServiceKeyToContainerName(dockerCompose, serviceKey) {
        const services = dockerCompose.getServiceList();
        let containerName = undefined;
        (0, ForEachHelper_1.forEach)(services, (service) => {
            if (service.key !== serviceKey) {
                return;
            }
            containerName = service.containerName;
            return false;
        });
        if (!(0, radashi_1.isString)(containerName)) {
            throw new Error('Failed to convert serviceKey: ' + serviceKey + ' to a container name!');
        }
        return containerName;
    }
}
exports.DockerComposeServiceSelectWizard = DockerComposeServiceSelectWizard;
//# sourceMappingURL=DockerComposeServiceSelectWizard.js.map