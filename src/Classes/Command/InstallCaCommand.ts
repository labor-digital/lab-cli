/*
 * Copyright 2021 LABOR.digital
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
 * Last modified: 2021.04.08 at 17:55
 */

import {ElevatedProcess} from '../Api/ElevatedProcess';
import {AppContext} from '../Core/AppContext';
import {CommandStack} from '../Core/Command/CommandStack';

export class InstallCaCommand
{
    /**
     * Executes the command
     * @param run
     * @param context
     * @param stack
     * @param otherArgs
     */
    public async execute(
        run: string,
        context: AppContext,
        stack: CommandStack,
        otherArgs: Array<string>
    ): Promise<AppContext>
    {
        const certPath = require.resolve('@labor-digital/ssl-certs/rootca/LaborRootCa.crt');
        
        const command = context.platform.choose({
            windows: 'powershell -command "Import-Certificate -Filepath \\"' + certPath +
                     '\\" -CertStoreLocation cert:\\LocalMachine\\Root"',
            darwin: 'security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "' +
                    certPath + '"',
            linux: 'mkdir -p /usr/share/ca-certificates/extra && ' +
                   'cp "' + certPath + '" /usr/share/ca-certificates/extra/LaborRootCa.crt &&' +
                   'update-ca-certificates'
        });
        
        (new ElevatedProcess(context)).exec(command);
        
        return context;
    }
    
}