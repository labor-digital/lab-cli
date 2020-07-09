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
 * Last modified: 2020.04.05 at 11:57
 */


export class CommandStack
{
    /**
     * The list of commands to process
     */
    protected _commands: Array<Array<string>>;
    
    /**
     * CommandStack constructor
     */
    public constructor()
    {
        this._commands = [];
    }
    
    /**
     * A command that should be executed as a cli command but without the "lab" prefix.
     * All parts of the command have to be given as array: so if you want to call "lab up -f" just pass: ["up", "-f"]
     *
     * @param command
     */
    public push(command: Array<string>): CommandStack
    {
        this._commands.push(command);
        return this;
    }
    
    /**
     * Returns true if there is a next command required
     */
    public hasNext(): boolean
    {
        return this._commands.length > 0;
    }
    
    /**
     * Returns the next command that should be executed
     */
    public getNext(): Array<string>
    {
        if (!this.hasNext()) {
            throw new Error('There is no next command!');
        }
        return this._commands.shift();
    }
}