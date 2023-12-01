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
 * Last modified: 2020.04.03 at 20:30
 */

import {PlainObject} from '@labor-digital/helferlein';
import {AppContext} from '../AppContext';

export class DefaultConfig
{
    public static make(context: AppContext): PlainObject
    {
        return {
            
            // The list of extensions to load
            extensions: [],
            
            // Docker related configuration
            docker: {
                // The shell to use when attaching to a container
                shell: 'bash',
                
                // The docker-compose service key to attach to.
                // Can be used to overwrite the default container name set by the docker app
                // NOTE: This overrides "containerName"!
                serviceKey: undefined,
                
                // The name of the container to attach to.
                // Can be used to overwrite the default container name set by the docker app
                // NOTE: This is overwritten by "serviceKey"
                containerName: undefined,
                
                // The local socket to connect with docker
                socketPath: context.platform.choose({
                    windows: '//./pipe/docker_engine',
                    linux: '/var/run/docker.sock'
                })
            },
            
            // Configuration of the docker network architecture
            network: {
                
                // Configuration for the domain creation
                domain: {
                    // The base domain for the generated project domains
                    base: '.labor.systems'
                },
                
                // Defines the path of the hosts file on your platform
                hostsFilePath: context.platform.choose({
                    windows: 'C:\\Windows\\System32\\Drivers\\etc\\hosts',
                    linux: '/etc/hosts'
                })
            },
            
            // Unison related configuration options
            unison: {
                
                // Configuration for the sync host
                host: {
                    // The local directory to sync with unison
                    directory: undefined
                },
                
                // Configuration for the sync target
                target: {
                    // The target ip of the unison server
                    ip: undefined,
                    // The remote unison port to sync with
                    port: 5000
                },
                
                // True to include node modules into the sync
                allowNodeModules: false,
                // Additional arguments as a string
                additionalArgs: '',
                
                // Configuration for the unison migration
                migration: {
                    targetVolume: '/var/www/html/',
                    definition: {
                        container_name: '${COMPOSE_PROJECT_NAME}-docker-unison',
                        image: 'labordigital/unison:2.48.4',
                        depends_on: [],
                        volumes_from: [],
                        environment: [
                            'APP_VOLUME=/var/www/html/',
                            'OWNER_UID=33',
                            'GROUP_ID=33'
                        ],
                        ports: []
                    }
                }
            },
            
            // Project init
            projectInit: {
                // The git repository to clone and find boilerplates in
                boilerplateRepository: 'https://github.com/labor-digital/docker-base-images-v2.git'
            }
        };
    }
}