"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const ForEachHelper_1 = require("./Utils/ForEachHelper");
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
 * Last modified: 2020.04.03 at 18:57
 */
const EventEmitter_1 = require("./EventEmitter");
const radashi_1 = require("radashi");
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
// @ts-ignore
const requireg_1 = __importDefault(require("requireg"));
const Platform_1 = require("../Api/Platform");
const AppContext_1 = require("./AppContext");
const AppEventList_1 = require("./AppEventList");
const AppRegistry_1 = require("./AppRegistry");
const CommandHandler_1 = require("./Command/CommandHandler");
const CommandRegistry_1 = require("./Command/CommandRegistry");
const DefaultCommands_1 = require("./Command/DefaultCommands");
const ConfigLoader_1 = require("./Configuration/ConfigLoader");
const FileFinder_1 = require("./FileFinder");
const Registry_1 = require("./Registry");
const UserError_1 = require("./Error/UserError");
class Application {
    /**
     * The main application controller
     */
    run() {
        let context = null;
        return this.createNewAppContext()
            .then(c => context = c)
            .then(c => this.prepareOutputMode(c))
            .then(c => this.showFancyIntro(c))
            .then(c => DefaultCommands_1.DefaultCommands.make(c))
            .then(c => this.loadExtensions(c))
            .then(c => context.emitSequentialHook(AppEventList_1.AppEventList.AFTER_EXTENSIONS_LOADED, c))
            .then(c => this.handleMigration(c))
            .then(c => this.handleCommand(c))
            .then(() => process.exit())
            .catch(err => {
            if (context !== null && context.isMachineReadableOutput) {
                const message = typeof (err === null || err === void 0 ? void 0 : err.message) === 'string' && err.message.trim() !== ''
                    ? err.message
                    : 'Unexpected error.';
                process.stdout.write(JSON.stringify({
                    status: 'error',
                    message
                }) + '\n');
                process.exit(1);
                return context;
            }
            if (typeof err === 'object' && err !== null && !(err.stack === undefined) && !(err instanceof UserError_1.UserError)) {
                err = err.stack;
            }
            console.error('');
            console.error(chalk_1.default.redBright('A FATAL ERROR OCCURRED!\r\nSadly I could not recover :(\r\n'));
            console.error(chalk_1.default.redBright(err));
            console.error('');
            process.exit(1);
            return context;
        });
    }
    /**
     * Applies runtime output configuration before any output is emitted
     * @param context
     */
    prepareOutputMode(context) {
        if (context.isMachineReadableOutput) {
            chalk_1.default.level = 0;
        }
        return Promise.resolve(context);
    }
    /**
     * Creates a new app config instance
     */
    createNewAppContext() {
        return Promise.resolve(new AppContext_1.AppContext(new commander_1.Command(), require('../../../package.json').version, new EventEmitter_1.EventEmitter(), new Platform_1.Platform(), new FileFinder_1.FileFinder(), new Registry_1.Registry(), new AppRegistry_1.AppRegistry(), new ConfigLoader_1.ConfigLoader(), new CommandRegistry_1.CommandRegistry()));
    }
    /**
     * Renders a nice into for our application
     * @param context
     */
    showFancyIntro(context) {
        if (context.isMachineReadableOutput) {
            return Promise.resolve(context);
        }
        const lang = [
            ['Guten Morgen', 'Guten Tag', 'Guten Abend'], // German
            ['Good morning', 'Good day', 'Good evening'], // English
            ['Buenos días', 'Buenos días', 'Buenas noches'], // Spanish
            ['Bonjour', 'Bonne journée', 'Bonsoir'], // French
            ['Godmorgen', 'God dag', 'God aften'], // Danish
            ['Buongiorno', 'Buona giornata', 'Buonasera'], // Italian
            ['Dobro jutro', 'Dobar dan', 'Dobra večer'], // Croatian
            ['Maidin mhaith', 'Dea-lá', 'Dea-oíche'], // Irish
            ['Günaydın', 'Iyi günler', 'İyi aksamlar'], // Turkish
            ['Dobroye utro', 'Dobryy den\'', 'Dobryy vecher'], // Russian (save for CLI without cyrillic font),
            ['Zǎoshang hǎo', 'měihǎo de yītiān', 'wǎnshàng hǎo'], // Chinese simplified (save for CLI without chinese font),
            ['Bonum mane', 'Bonus dies', 'Bonum vesperam'], // Latin
            ['Sawubona', 'Usuku oluhle', 'Sawubona'], // Zulu
            ['Madainn mhath', 'Latha math', 'Feasgar math'], // Scots Gaelic
            ['Hyvää huomenta', 'Hyvää päivää', 'Hyvää iltaa'], // Finish
            ['Kaliméra', 'Kalíméra', 'Kaló apógevma'], // Greek
            ['Goeie more', 'Goeie dag', 'Goeienaand'] // Afrikaans
        ];
        const h = new Date().getHours();
        const timeKey = h < 12 ? 0 : (h < 18 ? 1 : 2);
        const langKey = (Math.floor(Math.random() * lang.length));
        const prefix = lang[langKey][timeKey];
        console.log(prefix + ', you are using LAB ' + context.version);
        return Promise.resolve(context);
    }
    /**
     * Loads the extensions that were registered in the configuration object
     * @param context
     */
    loadExtensions(context) {
        return new Promise(resolve => {
            // Check if we have configured extensions
            const extensionsNames = context.config.get('extensions', []);
            if (!(0, radashi_1.isArray)(extensionsNames) || (0, radashi_1.isEmpty)(extensionsNames)) {
                return resolve(context);
            }
            // Gather the required extensions
            context.eventEmitter.unbindAll(AppEventList_1.AppEventList.EXTENSION_LOADING);
            (0, ForEachHelper_1.forEach)(extensionsNames, (extensionName) => {
                try {
                    if (!(0, radashi_1.isString)(extensionName)) {
                        throw new Error('Invalid extension name given!');
                    }
                    let extension = (0, requireg_1.default)(extensionName);
                    if (!(0, radashi_1.isFunction)(extension)) {
                        if ((0, radashi_1.isObject)(extension) && (0, radashi_1.isFunction)(extension.default)) {
                            extension = extension.default;
                        }
                        else {
                            throw new Error('The extension did not export a function!');
                        }
                    }
                    context.eventEmitter.bind(AppEventList_1.AppEventList.EXTENSION_LOADING, () => {
                        return extension(context);
                    });
                }
                catch (e) {
                    if ((e === undefined)) {
                        e = new Error(e);
                    }
                    console.log(chalk_1.default.redBright('Error while loading extension: ' + extensionName + '! ' + e.message));
                }
            });
            // Trigger the extension import
            return context.eventEmitter.emitHook(AppEventList_1.AppEventList.EXTENSION_LOADING, {})
                .then(() => context);
        });
    }
    /**
     * Allows for upcoming version migration between app versions
     * @param context
     */
    handleMigration(context) {
        const currentVersion = context.version;
        const storedVersion = context.registry.get('version');
        if (currentVersion === storedVersion) {
            return Promise.resolve(context);
        }
        // Allow extensions to handle migrations
        return context.emitSequentialHook(AppEventList_1.AppEventList.MIGRATE, {
            currentVersion,
            storedVersion
        }).then(() => {
            // Update the stored version
            context.registry.set('version', context.version);
            return context;
        });
    }
    /**
     * Handle the required command based on the registered commands
     * @param context
     */
    handleCommand(context) {
        return (new CommandHandler_1.CommandHandler()).handle(context);
    }
}
exports.Application = Application;
//# sourceMappingURL=Application.js.map