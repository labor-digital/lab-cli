"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
const radashi_1 = require("radashi");
const ForEachHelper_1 = require("../Utils/ForEachHelper");
const makeOptions_1 = require("../Utils/makeOptions");
class CommandRegistry {
    /**
     * CommandRegistry constructor
     */
    constructor() {
        this._commands = [];
    }
    /**
     * Registers a new command in the registry
     * @param signature The command signature valid to (https://www.npmjs.com/package/commander) command definition
     * @param filename The name of the command file that contains the command class
     * @param options A list of options for the command
     */
    registerCommand(signature, filename, options) {
        if ((0, radashi_1.isNullish)(options)) {
            // @ts-ignore
            options = {};
        }
        this._commands.push({
            signature,
            filename,
            options: (0, makeOptions_1.makeOptions)(options, {
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
    getCommands(context) {
        const commands = [];
        (0, ForEachHelper_1.forEach)(this._commands, (command) => {
            if (!context.platform.isCommandSupported(command.options.platforms)) {
                return;
            }
            commands.push(command);
        });
        return commands;
    }
}
exports.CommandRegistry = CommandRegistry;
//# sourceMappingURL=CommandRegistry.js.map