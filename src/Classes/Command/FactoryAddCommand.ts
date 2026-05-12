/*
 * Copyright 2026 LABOR.digital
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
 */

import { isArray, isObject as isPlainObject, isString } from 'radashi';

import chalk from 'chalk';
import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import {execSync} from 'child_process';
import inquirer from 'inquirer';
import {AppContext} from '../Core/AppContext';
import {CommandStack} from '../Core/Command/CommandStack';
import {UserError} from '../Core/Error/UserError';
import {
    FactoryComponentManifest,
    FactoryComponentManifestEntry,
    fetchComponentManifest
} from '../Core/Factory/ComponentManifest';

interface FactoryConfig
{
    core_version: string;
    active_components: Array<string>;
    [key: string]: any;
}

interface AddComponentSuccessResponse
{
    status: 'success';
    context: 'frontend' | 'backend';
    component: string;
    message?: string;
    installed: string[];
}

interface AddComponentRequiresUpdateResponse
{
    status: 'requires_update';
    component: string;
    current_core_version: string;
    required_core_version: string;
    message: string;
}

interface AddComponentErrorResponse
{
    status: 'error';
    message: string;
}

type AddComponentResponse = AddComponentSuccessResponse | AddComponentRequiresUpdateResponse | AddComponentErrorResponse;

export class FactoryAddCommand
{
    public async execute(...args: any[]): Promise<void>
    {
        const cmd = args[args.length - 1] as Command;
        const context = args[1] as AppContext;
        const componentName = cmd.args[0] as string;
        return this.handle(componentName, cmd, context);
    }

    protected async handle(componentName: string, cmd: Command, context: AppContext): Promise<void>
    {
        try {
            if (!isString(componentName) || componentName.trim() === '') {
                throw new UserError('Component name is required.');
            }

            componentName = componentName.trim();
            const configPath = await this.resolveFactoryPath(cmd, context);
            const config = this.readFactoryConfig(configPath);
            const manifest = await this.getManifest(context.cwd);
            const manifestEntry = manifest[componentName];

            const hasComposer = fs.existsSync(path.join(context.cwd, 'composer.json'));
            const hasPackage = fs.existsSync(path.join(context.cwd, 'package.json'));

            let envContext: 'frontend' | 'backend';
            if (hasComposer && !hasPackage) {
                envContext = 'backend';
            } else if (hasPackage && !hasComposer) {
                envContext = 'frontend';
            } else {
                return this.respond(cmd, {
                    status: 'error',
                    message: 'Could not determine project context. Please run this command inside a specific app directory containing either composer.json or package.json (but not both).'
                });
            }

            if (!isPlainObject(manifestEntry)) {
                return this.respond(cmd, {
                    status: 'error',
                    message: 'Component not found in factory manifest.'
                });
            }

            this.validateManifestEntry(manifestEntry);

            if (semver.gt(manifestEntry.version, config.core_version)) {
                return this.respond(cmd, {
                    status: 'requires_update',
                    component: componentName,
                    current_core_version: config.core_version,
                    required_core_version: manifestEntry.version,
                    message: 'Update required. Run lab upgrade.'
                });
            }

            const composerDeps = isArray(manifestEntry.composer_dependencies) ? manifestEntry.composer_dependencies : [];
            const npmDeps = isArray(manifestEntry.npm_dependencies) ? manifestEntry.npm_dependencies : [];

            let installedDeps: string[] = [];

            if (config.active_components.indexOf(componentName) === -1) {
                try {
                    if (envContext === 'backend' && composerDeps.length > 0) {
                        execSync(`composer require ${composerDeps.join(' ')} --with-all-dependencies`, {
                            cwd: context.cwd,
                            stdio: 'pipe'
                        });
                        installedDeps = composerDeps;
                    } else if (envContext === 'frontend' && npmDeps.length > 0) {
                        execSync(`npm install ${npmDeps.join(' ')}`, {
                            cwd: context.cwd,
                            stdio: 'pipe'
                        });
                        installedDeps = npmDeps;
                    }
                } catch (e: any) {
                    const stderr = e.stderr ? e.stderr.toString().trim() : e.message;
                    return this.respond(cmd, {
                        status: 'error',
                        message: `Failed to install dependencies: ${stderr}`
                    });
                }

                config.active_components.push(componentName);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
            }

            return this.respond(cmd, {
                status: 'success',
                context: envContext,
                component: componentName,
                installed: installedDeps
            });
        } catch (error: any) {
            if (error.message === 'PROCESS_EXIT') {
                return;
            }

            const message = error instanceof UserError && isString(error.message) && error.message.trim() !== ''
                ? error.message
                : 'Unexpected error while adding component.';

            return this.respond(cmd, {
                status: 'error',
                message
            });
        }
    }

    protected readFactoryConfig(configPath: string): FactoryConfig
    {
        if (!fs.existsSync(configPath)) {
            throw new UserError('factory.json not found in current working directory.');
        }

        let parsedConfig: unknown;
        try {
            parsedConfig = JSON.parse(fs.readFileSync(configPath).toString('utf-8'));
        } catch (error) {
            throw new UserError('Invalid factory.json configuration.');
        }

        if (!isPlainObject(parsedConfig)) {
            throw new UserError('Invalid factory.json configuration.');
        }

        const coreVersion = (parsedConfig as FactoryConfig).core_version;
        const activeComponents = (parsedConfig as FactoryConfig).active_components;

        if (!isString(coreVersion) || coreVersion.trim() === '' || !semver.valid(coreVersion)) {
            throw new UserError('Invalid factory.json configuration.');
        }

        if (!isArray(activeComponents) || activeComponents.some(component => !isString(component))) {
            throw new UserError('Invalid factory.json configuration.');
        }

        return parsedConfig as FactoryConfig;
    }

    protected async resolveFactoryPath(cmd: Command, context: AppContext): Promise<string>
    {
        const options = typeof cmd.opts === 'function' ? cmd.opts() : {};
        const isJson = this.isJsonOutput(cmd);

        // Step A: If the --factory <path> flag is provided
        if (options.factory && isString(options.factory)) {
            const explicitPath = path.resolve(context.cwd, options.factory);
            if (fs.existsSync(explicitPath)) {
                return explicitPath;
            }
        }

        // Step B: Check if fs.existsSync(path.resolve(process.cwd(), 'factory.json'))
        const rootPath = path.resolve(context.cwd, 'factory.json');
        if (fs.existsSync(rootPath)) {
            return rootPath;
        }

        // Step C: Check if fs.existsSync(path.resolve(process.cwd(), 'src/factory.json'))
        const srcPath = path.resolve(context.cwd, 'src/factory.json');
        if (fs.existsSync(srcPath)) {
            return srcPath;
        }

        // Missing File Handling
        if (isJson) {
            process.stdout.write(JSON.stringify({
                status: 'error',
                message: 'factory.json not found. Please provide the path using the --factory flag.'
            }) + '\n');
            process.exit(1);
            throw new Error('PROCESS_EXIT');
        }

        console.log(chalk.yellow('Warning: factory.json was not found automatically. It should ideally be at the root level alongside your package.json or composer.json.'));
        
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'factoryPath',
                message: 'Please provide the relative path to your factory.json file:'
            }
        ]);

        const resolvedPath = path.resolve(context.cwd, answers.factoryPath);
        if (!fs.existsSync(resolvedPath)) {
            throw new UserError(`factory.json not found at provided path: ${resolvedPath}`);
        }

        return resolvedPath;
    }

    protected async getManifest(cwd: string): Promise<FactoryComponentManifest>
    {
        try {
            return await fetchComponentManifest(cwd);
        } catch (error) {
            // UserErrors from fetchComponentManifest carry actionable messages
            // (missing file, bad JSON, wrong cwd). Don't flatten them.
            if (error instanceof UserError) {
                throw error;
            }
            throw new UserError('Failed to fetch factory manifest.');
        }
    }

    protected validateManifestEntry(entry: FactoryComponentManifestEntry): void
    {
        if (!isString(entry.version) || !semver.valid(entry.version)) {
            throw new UserError('Invalid factory manifest configuration.');
        }
        if (entry.composer_dependencies !== undefined && (!isArray(entry.composer_dependencies) || entry.composer_dependencies.some(d => !isString(d) || d.trim() === ''))) {
            throw new UserError('Invalid factory manifest configuration.');
        }
        if (entry.npm_dependencies !== undefined && (!isArray(entry.npm_dependencies) || entry.npm_dependencies.some(d => !isString(d) || d.trim() === ''))) {
            throw new UserError('Invalid factory manifest configuration.');
        }
    }

    protected respond(cmd: Command, payload: AddComponentResponse): Promise<void>
    {
        if (this.isJsonOutput(cmd)) {
            process.stdout.write(JSON.stringify(payload) + '\n');
            return Promise.resolve();
        }

        switch (payload.status) {
            case 'success':
                if (payload.message) {
                    console.log(chalk.greenBright(payload.message));
                } else {
                    console.log(chalk.greenBright(`Component ${payload.component} added successfully.`));
                }
                break;
            case 'requires_update':
                console.log(chalk.yellowBright(
                    payload.message + ' Required: ' + payload.required_core_version +
                    ', current: ' + payload.current_core_version + '.'
                ));
                break;
            default:
                console.log(chalk.redBright(payload.message));
                break;
        }

        return Promise.resolve();
    }

    protected isJsonOutput(cmd: Command): boolean
    {
        if (typeof cmd.opts === 'function') {
            const options = cmd.opts();
            if (isPlainObject(options) && options.json === true) {
                return true;
            }
        }

        return process.argv.indexOf('--json') !== -1;
    }
}
