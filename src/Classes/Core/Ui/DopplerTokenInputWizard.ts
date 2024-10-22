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
 * Last modified: 2020.04.05 at 22:40
 */
import inquirer from 'inquirer';

export class DopplerTokenInputWizard
{
    
    /**
     * Asks the user for his doppler token
     */
    public static run(initialQuestion: string): Promise<string>
    {
        return new Promise<string>((resolve) => {
            inquirer.prompt([
                {
                    name: 'dopplerToken',
                    type: 'password',
                    message: initialQuestion + ' Please type in your doppler token (Could be your personal one, or a service token tied to the dev config of this project): ',
                    filter: input => input.trim().toLowerCase(),
                    validate: (input: string) => {
                        if (input.length === 0) {
                            return 'The input can\'t be empty!';
                        }
                        if (input.indexOf("dp.pt.") === -1 && input.indexOf("dp.st.") === -1) {
                            return 'The token has to start with "dp.pt." or "dp.st."';
                        }
                        return true;
                    }
                }
            ]).then(answers => {
                return resolve(answers.dopplerToken);
            });
        });
    }
    
}
