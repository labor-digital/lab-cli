"use strict";
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
 * Last modified: 2020.04.05 at 14:00
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const radashi_1 = require("radashi");
const chalk_1 = __importDefault(require("chalk"));
const AppEventList_1 = require("../AppEventList");
const ForEachHelper_1 = require("../Utils/ForEachHelper");
const CommandStack_1 = require("./CommandStack");
class CommandHandler {
    /**
     * Gathers the registered commands and handles the execution using the commander program as controller
     * @param context
     */
    handle(context) {
        return new Promise((resolve, reject) => {
            this._commandWasExecuted = false;
            // Create the command stack
            this._stack = new CommandStack_1.CommandStack();
            // Register the version command
            context.program.version(context.version + '', '-v, --version');
            // Build the command definitions
            this.buildDefinitions(context, resolve, reject);
            // Fall back handler to render the correct error message
            context.program.on('command:*', () => {
                // Silence...
            });
            // Start program
            const parseResult = context.program.parse(process.argv);
            // Check if we could execute a task
            if (!this._commandWasExecuted && parseResult.args.length === 0) {
                context.program.help();
            }
            // Check if a command was found
            if (!this._commandWasExecuted) {
                console.error(chalk_1.default.redBright('Invalid command "' + parseResult.args[0] +
                    '" given! \r\nUse "lab help" to see a list of supported commands!'));
                resolve(context);
            }
        });
    }
    /**
     * Builds the internal command definitions based on the registered command options
     * @param context
     * @param resolve
     * @param reject
     */
    buildDefinitions(context, resolve, reject) {
        // Iterate all commands
        (0, ForEachHelper_1.forEach)(context.commandRegistry.getCommands(context), (command) => {
            // Register the basic command information
            const c = context.program.command(command.signature);
            c.description(command.options.description);
            c.alias(command.options.alias);
            if (!(0, radashi_1.isEmpty)(command.options.options)) {
                (0, ForEachHelper_1.forEach)(command.options.options, (option) => {
                    c.option(option.definition, option.description, option.validation, option.default);
                });
            }
            // Check if we have a "onRegistration" hook
            if ((0, radashi_1.isFunction)(command.options.onRegistration)) {
                command.options.onRegistration();
            }
            // Register the command action
            c.action((cmd, ...args) => {
                this._commandWasExecuted = true;
                this.handleCommandAction(args[0], args, context, command, resolve, reject);
            });
        });
    }
    /**
     * Internal helper to handle the controller resolving lazily when a command action is executed
     * It also handles the redirect for additional actions when the command stack was pushed
     * @param cmd
     * @param args
     * @param context
     * @param command
     * @param resolve
     * @param reject
     */
    handleCommandAction(cmd, args, context, command, resolve, reject) {
        context.emitSequentialHook(AppEventList_1.AppEventList.BEFORE_ACTION, {
            cmd, args, command
        }).then(() => {
            return new Promise((resolve1, reject1) => {
                // Execute the handler
                let result = null;
                try {
                    // Try to find the handler
                    let handler = require(command.filename);
                    if ((0, radashi_1.isFunction)(handler.default)) {
                        handler = handler.default;
                    }
                    else if (Object.keys(handler).length === 1) {
                        handler = handler[Object.keys(handler)[0]];
                    }
                    else {
                        return reject1(new Error('Invalid command handler class for command: ' + command.signature));
                    }
                    // Build handler arguments
                    const handlerArgs = [cmd, context, this._stack, ...args];
                    // Run the handler
                    result = (new handler())[command.options.action](...handlerArgs);
                    if (!(result instanceof Promise)) {
                        return reject1(new Error('The command "' + command.signature +
                            '" did not return a promise in its action method: "' +
                            command.options.action + '"'));
                    }
                    // Wait until the handler is done
                    result.catch(reject1).then(() => {
                        // Check if we have a next command
                        if (this._stack.hasNext()) {
                            context.program.parse([
                                process.argv[0],
                                process.argv[1],
                                ...this._stack.getNext()
                            ]);
                            return;
                        }
                        // Be done
                        return resolve1();
                    });
                }
                catch (e) {
                    return reject1(e);
                }
            });
        }).then(() => {
            context.emitSequentialHook(AppEventList_1.AppEventList.AFTER_ACTION, {
                cmd, args, command
            });
        }).catch(reject).then(() => resolve(context));
    }
}
exports.CommandHandler = CommandHandler;
//# sourceMappingURL=CommandHandler.js.map