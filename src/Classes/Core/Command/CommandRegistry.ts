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
 * Last modified: 2020.04.05 at 13:48
 */

import {forEach} from '@labor-digital/helferlein/lib/Lists/forEach';
import makeOptions from '@labor-digital/helferlein/lib/Misc/makeOptions';
import {isUndefined} from '@labor-digital/helferlein/lib/Types/isUndefined';
import {AppContext} from '../AppContext';

export interface CommandOptionDefinition
{
    /**
     * The definition based on the commander option
     */
    definition: string;
    
    /**
     * The description for the command
     */
    description?: string;
    
    /**
     * A optional validation to validate the option value
     */
    validation?: RegExp
    
    /**
     * The default value for the option
     */
    default?: any
}

export interface CommandPlatformDefinition
{
    windows: boolean;
    linux: boolean;
    darwin: boolean;
}

export interface CommandOptions
{
    /**
     * A list of aliases for the current command
     */
    alias?: string;
    
    /**
     * A description for the command help
     */
    description?: string;
    
    /**
     * The name of the action method in the command class
     */
    action?: string;
    
    /**
     * A list of options that can be supplied for this command
     */
    options?: Array<CommandOptionDefinition>;
    
    /**
     * A list of supported platforms for this command.
     */
    platforms?: CommandPlatformDefinition;
    
    /**
     * A callback to be executed when the command is registered as action.
     * Useful if your command has to hook itself into a global structure before
     * the class is loaded
     */
    onRegistration?: Function;
}

export interface CommandDefinition
{
    /**
     * The command signature valid to (https://www.npmjs.com/package/commander) command definition
     */
    signature: string
    
    /**
     * The name of the command file that contains the command class
     */
    filename: string;
    
    /**
     * The given options for this command
     */
    options: CommandOptions;
}

export class CommandRegistry
{
    
    /**
     * The list of registered commands
     */
    protected _commands: Array<CommandDefinition>;
    
    /**
     * CommandRegistry constructor
     */
    public constructor()
    {
        this._commands = [];
    }
    
    /**
     * Registers a new command in the registry
     * @param signature The command signature valid to (https://www.npmjs.com/package/commander) command definition
     * @param filename The name of the command file that contains the command class
     * @param options A list of options for the command
     */
    public registerCommand(signature: string, filename: string, options?: CommandOptions): CommandRegistry
    {
        if (isUndefined(options)) {
            // @ts-ignore
            options = {};
        }
        this._commands.push({
            signature,
            filename,
            options: makeOptions(options, {
                alias: {
                    type: 'string',
                    default: ''
                },
                description: {
                    type: 'string',
                    default: ''
                },
                action: {
                    type: 'string',
                    default: 'execute'
                },
                options: {
                    type: 'array',
                    default: []
                },
                onRegistration: {
                    type: ['callable', 'null'],
                    default: null
                },
                platforms: {
                    type: 'plainObject',
                    default: {},
                    children: {
                        windows: {
                            type: 'bool',
                            default: true
                        },
                        linux: {
                            type: 'bool',
                            default: false
                        },
                        darwin: {
                            type: 'bool',
                            default: false
                        }
                    }
                }
            })
        });
        return this;
    }
    
    /**
     * Returns the list of commands that are supported on the current platform
     * @param context
     */
    public getCommands(context: AppContext): Array<CommandDefinition>
    {
        const commands: Array<CommandDefinition> = [];
        forEach(this._commands, (command: CommandDefinition) => {
            if (!context.platform.isCommandSupported(command.options.platforms)) {
                return;
            }
            commands.push(command);
        });
        return commands;
    }
}