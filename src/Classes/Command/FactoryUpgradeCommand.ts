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

import { isObject as isPlainObject, isString } from 'radashi';
import chalk from 'chalk';
import * as childProcess from 'child_process';
import {Command} from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import inquirer from 'inquirer';
import {AppContext} from '../Core/AppContext';
import {CommandStack} from '../Core/Command/CommandStack';
import {UserError} from '../Core/Error/UserError';
import {fetchComponentManifest} from '../Core/Factory/ComponentManifest';

interface FactoryConfig {
    core_version: string;
    [key: string]: any;
}

interface UpgradeSuccessResponse {
    status: 'success';
    previous_version: string;
    new_version: string;
    message: string;
}

interface UpgradeNoopResponse {
    status: 'noop';
    previous_version: string;
    new_version: string;
    message: string;
}

interface UpgradeErrorResponse {
    status: 'error';
    previous_version: string | null;
    new_version: string | null;
    message: string;
    stderr?: string;
}

type UpgradeResponse = UpgradeSuccessResponse | UpgradeNoopResponse | UpgradeErrorResponse;

export class FactoryUpgradeCommand {
    public execute(context: AppContext, stack: CommandStack, cmd: Command): Promise<void> {
        return this.handle(cmd, context);
    }

    protected async handle(cmd: Command, context: AppContext): Promise<void> {
        let currentVersion: string | null = null;
        let targetVersion: string | null = null;

        try {
            const configPath = await this.resolveFactoryPath(cmd, context);
            const config = this.readFactoryConfig(configPath);
            currentVersion = config.core_version;
            targetVersion = await this.resolveTargetVersion(cmd, context);

            if (semver.lte(targetVersion, currentVersion)) {
                return this.respond(cmd, {
                    status: 'noop',
                    previous_version: currentVersion,
                    new_version: currentVersion,
                    message: 'Already up to date.'
                });
            }

            await this.runUpgradeSequence(cmd, context.cwd, targetVersion);
            this.writeFactoryConfig(configPath, config, targetVersion);

            return this.respond(cmd, {
                status: 'success',
                previous_version: currentVersion,
                new_version: targetVersion,
                message: 'Core upgraded successfully.'
            });
        } catch (error: any) {
            if (error.message === 'PROCESS_EXIT') {
                return;
            }
            return this.respond(cmd, this.makeErrorResponse(error, currentVersion, targetVersion));
        }
    }

    protected async resolveFactoryPath(cmd: Command, context: AppContext): Promise<string> {
        const options = typeof cmd.opts === 'function' ? cmd.opts() : {};
        const isJson = this.isJsonOutput(cmd);

        if (options.factory && isString(options.factory)) {
            const explicitPath = path.resolve(context.cwd, options.factory);
            if (fs.existsSync(explicitPath)) {
                return explicitPath;
            }
        }

        const rootPath = path.resolve(context.cwd, 'factory.json');
        if (fs.existsSync(rootPath)) {
            return rootPath;
        }

        const srcPath = path.resolve(context.cwd, 'src/factory.json');
        if (fs.existsSync(srcPath)) {
            return srcPath;
        }

        if (isJson) {
            process.stdout.write(JSON.stringify({
                status: 'error',
                message: 'factory.json not found. Please provide the path using the --factory flag.'
            }) + '\n');
            process.exit(1);
            throw new Error('PROCESS_EXIT');
        }

        console.log(chalk.yellow('Warning: factory.json was not found automatically.'));
        
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

    protected readFactoryConfig(configPath: string): FactoryConfig {
        if (!fs.existsSync(configPath)) {
            throw new UserError('factory.json not found.');
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
        if (!isString(coreVersion) || coreVersion.trim() === '' || !semver.valid(coreVersion)) {
            throw new UserError('Invalid factory.json configuration.');
        }

        return parsedConfig as FactoryConfig;
    }

    protected async resolveTargetVersion(cmd: Command, context: AppContext): Promise<string> {
        const options = typeof cmd.opts === 'function' ? cmd.opts() : {};
        const requestedTarget = isString(options.target) ? options.target.trim() : '';
        
        let targetVersion = requestedTarget;
        if (targetVersion === '') {
            try {
                const manifest = await fetchComponentManifest(context.cwd);
                if (manifest && manifest['core'] && isString(manifest['core'].version)) {
                    targetVersion = manifest['core'].version;
                } else {
                    targetVersion = '1.6.0'; // Fallback if core is not in manifest
                }
            } catch (e) {
                targetVersion = '1.6.0';
            }
        }

        const normalizedTargetVersion = semver.valid(targetVersion);
        if (!normalizedTargetVersion) {
            throw new UserError('Invalid target version.');
        }

        return normalizedTargetVersion;
    }

    protected async runUpgradeSequence(cmd: Command, cwd: string, targetVersion: string): Promise<void> {
        const hasComposer = fs.existsSync(path.join(cwd, 'composer.json'));
        const hasPackage = fs.existsSync(path.join(cwd, 'package.json'));

        if (hasComposer && !hasPackage) {
            this.log(cmd, 'Updating TYPO3 factory core dependency...');
            await this.executeStep(
                'composer',
                ['require', 'my-agency/factory-core:' + targetVersion, '--with-all-dependencies'],
                cwd
            );

            this.log(cmd, 'Running TYPO3 database schema migrations...');
            await this.executeStep(
                'vendor/bin/typo3',
                ['database:updateschema'],
                cwd
            );
        } else if (hasPackage && !hasComposer) {
            this.log(cmd, 'Updating Nuxt factory layer dependency...');
            await this.executeStep(
                'npm',
                ['install', '@my-agency/factory-nuxt-layer@' + targetVersion],
                cwd
            );
        } else {
            throw new UserError('Could not determine project context. Please run this command inside a specific app directory containing either composer.json or package.json (but not both).');
        }
    }

    protected async executeStep(
        command: string,
        args: Array<string>,
        cwd: string
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const child = childProcess.spawn(command, args, {
                cwd,
                env: process.env,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (chunk: Buffer | string) => {
                stdout += chunk.toString();
            });

            child.stderr.on('data', (chunk: Buffer | string) => {
                stderr += chunk.toString();
            });

            child.on('error', (error: Error) => {
                reject({
                    error,
                    stdout,
                    stderr
                });
            });

            child.on('close', (code: number | null) => {
                if (code === 0) {
                    return resolve();
                }

                reject({
                    code,
                    stdout,
                    stderr,
                    message: command + ' exited with code ' + code + '.'
                });
            });
        });
    }

    protected writeFactoryConfig(configPath: string, config: FactoryConfig, targetVersion: string): void {
        try {
            const nextConfig: FactoryConfig = {
                ...config,
                core_version: targetVersion
            };
            fs.writeFileSync(configPath, JSON.stringify(nextConfig, null, 2) + '\n', 'utf-8');
        } catch (error) {
            throw new UserError('Failed to update factory.json.');
        }
    }

    protected makeErrorResponse(
        error: unknown,
        currentVersion: string | null,
        targetVersion: string | null
    ): UpgradeErrorResponse {
        const message = error instanceof UserError && isString(error.message) && error.message.trim() !== ''
            ? error.message
            : error instanceof Error && isString(error.message) && error.message.trim() !== ''
                ? error.message
                : 'Unexpected error while upgrading factory core.';

        const response: UpgradeErrorResponse = {
            status: 'error',
            previous_version: currentVersion,
            new_version: targetVersion,
            message
        };

        const stderr = this.extractStderr(error);
        if (stderr !== '') {
            response.stderr = stderr;
        }

        return response;
    }

    protected extractStderr(error: unknown): string {
        if (!isPlainObject(error)) {
            return '';
        }

        const stderr = (error as {stderr?: unknown}).stderr;
        if (isString(stderr) && stderr.trim() !== '') {
            return stderr.trim();
        }

        const stdout = (error as {stdout?: unknown}).stdout;
        if (isString(stdout) && stdout.trim() !== '') {
            return stdout.trim();
        }

        return '';
    }

    protected respond(cmd: Command, payload: UpgradeResponse): Promise<void> {
        if (this.isJsonOutput(cmd)) {
            process.stdout.write(JSON.stringify(payload) + '\n');
            return Promise.resolve();
        }

        switch (payload.status) {
            case 'success':
                console.log(chalk.greenBright(payload.message));
                break;
            case 'noop':
                console.log(chalk.yellowBright(payload.message));
                break;
            default:
                console.log(chalk.redBright(payload.message));
                if (isString(payload.stderr) && payload.stderr.trim() !== '') {
                    console.log(chalk.redBright(payload.stderr));
                }
                break;
        }

        return Promise.resolve();
    }

    protected isJsonOutput(cmd: Command): boolean {
        const options = typeof cmd.opts === 'function' ? cmd.opts() : {};
        if (options.json === true) {
            return true;
        }

        return process.argv.indexOf('--json') !== -1;
    }

    protected log(cmd: Command, message: string): void {
        if (this.isJsonOutput(cmd)) {
            return;
        }

        console.log(message);
    }
}
