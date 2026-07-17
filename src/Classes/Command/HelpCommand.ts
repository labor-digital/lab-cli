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
 */

import chalk from 'chalk';
import {Command} from 'commander';
import {AppContext} from '../Core/AppContext';
import {CommandDefinition} from '../Core/Command/CommandRegistry';
import {forEach} from '../Core/Utils/ForEachHelper';

/**
 * A single command as exposed in the overview.
 */
interface HelpCommandEntry
{
    name: string;
    signature: string;
    alias: string | null;
    description: string;
    platforms: any;
    options: Array<{flag: string; description: string | null; default: any}>;
}

/**
 * The complete machine-readable overview of the CLI.
 */
interface HelpOverview
{
    name: string;
    version: string;
    description: string;
    worktreeAware: boolean;
    usage: Array<string>;
    prerequisites: Array<string>;
    commands: Array<HelpCommandEntry>;
}

/**
 * Ordered, human friendly grouping of the commands. Any command that is not
 * listed here still shows up automatically under "Other commands", so new
 * commands are never silently hidden from the overview.
 */
const COMMAND_GROUPS: Array<{title: string; commands: Array<string>}> = [
    {title: 'Run & inspect your app', commands: ['up', 'restart', 'stop', 'down', 'status', 'logs', 'shell', 'open', 'sync']},
    {title: 'Docker engine', commands: ['start-engine', 'stop-engine', 'restart-engine', 'stop-all']},
    {title: 'Project setup & data', commands: ['init', 'import', 'export', 'test', 'installCa']},
    {title: 'Utilities', commands: ['npm', 'help']}
];

/**
 * Renders a full, self-contained overview of everything the CLI can do.
 *
 * "lab help"          -> a grouped, human readable overview for people who do
 *                        not know the CLI yet.
 * "lab help --json"   -> the very same information as JSON, so scripts and AI
 *                        agents can discover every command, alias, option and
 *                        supported platform without scraping formatted text.
 *
 * The command list is read from the command registry, so the overview always
 * matches the commands that are actually available on the current platform.
 */
export class HelpCommand
{
    public execute(_cmd: Command, context: AppContext): Promise<void>
    {
        const overview = this.buildOverview(context);

        if (context.isMachineReadableOutput) {
            console.log(JSON.stringify(overview, null, 2));
            return Promise.resolve();
        }

        this.renderHuman(overview);
        return Promise.resolve();
    }

    /**
     * Collects the overview data from the command registry and static metadata.
     */
    protected buildOverview(context: AppContext): HelpOverview
    {
        const commands: Array<HelpCommandEntry> = [];
        forEach(context.commandRegistry.getCommands(context), (command: CommandDefinition) => {
            const options = (command.options.options || []).map(o => ({
                flag: o.definition,
                description: o.description || null,
                default: typeof o.default === 'undefined' ? null : o.default
            }));
            commands.push({
                name: command.signature.split(/\s+/)[0],
                signature: command.signature,
                alias: command.options.alias ? command.options.alias : null,
                description: command.options.description || '',
                platforms: command.options.platforms,
                options: options
            });
        });

        return {
            name: 'lab',
            version: context.version,
            description: 'A CLI for your docker based development environment by LABOR.digital.',
            worktreeAware: true,
            usage: [
                'lab <command> [options]',
                'lab help              show this overview',
                'lab help --json       machine-readable overview (scripts & AI agents)',
                'lab <command> --help  detailed help & options for a single command'
            ],
            prerequisites: [
                'Docker with the "docker compose" plugin v2.29+ and a running docker engine (lab start-engine)',
                'Node.js 22 or newer',
                'Doppler CLI - only required for apps that use Doppler-managed secrets'
            ],
            commands: commands
        };
    }

    /**
     * Prints the grouped, human readable overview.
     */
    protected renderHuman(overview: HelpOverview): void
    {
        const byName: Record<string, HelpCommandEntry> = {};
        overview.commands.forEach(c => { byName[c.name] = c; });

        const lines: Array<string> = [];
        lines.push('');
        lines.push(chalk.bold(overview.name + ' ' + overview.version) + ' - ' + overview.description);

        lines.push('');
        lines.push(chalk.bold('USAGE'));
        overview.usage.forEach(u => lines.push('  ' + u));

        lines.push('');
        lines.push(chalk.bold('PREREQUISITES'));
        overview.prerequisites.forEach(p => lines.push('  - ' + p));

        // Grouped commands
        const rendered = new Set<string>();
        COMMAND_GROUPS.forEach(group => {
            const entries = group.commands.map(name => byName[name]).filter(Boolean) as Array<HelpCommandEntry>;
            if (entries.length === 0) {
                return;
            }
            lines.push('');
            lines.push(chalk.bold(group.title.toUpperCase()));
            entries.forEach(entry => {
                rendered.add(entry.name);
                lines.push('  ' + this.renderCommandLine(entry));
            });
        });

        // Anything the groups did not cover
        const leftovers = overview.commands.filter(c => !rendered.has(c.name));
        if (leftovers.length > 0) {
            lines.push('');
            lines.push(chalk.bold('OTHER COMMANDS'));
            leftovers.forEach(entry => lines.push('  ' + this.renderCommandLine(entry)));
        }

        lines.push('');
        lines.push(chalk.bold('GIT WORKTREES') + ' (new in v4.0.0)');
        lines.push('  Running lab inside a linked git worktree spins up an ISOLATED instance:');
        lines.push('  its own compose project, domain, IP and hosts entry, so it runs alongside');
        lines.push('  your main checkout without clashing. Doppler secrets stay shared with main.');

        lines.push('');
        lines.push('See the README for a full deep dive into every command.');
        lines.push('');

        console.log(lines.join('\n'));
    }

    /**
     * Formats a single command as "<name>, <alias>   <description>".
     */
    protected renderCommandLine(entry: HelpCommandEntry): string
    {
        const label = entry.alias ? entry.name + ', ' + entry.alias : entry.name;
        const padded = label.length >= 22 ? label + '  ' : label + ' '.repeat(22 - label.length);
        return chalk.greenBright(padded) + entry.description;
    }
}
