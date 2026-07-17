import { Command } from 'commander';
import { HelpCommand } from '../src/Classes/Command/HelpCommand';
import { AppContext } from '../src/Classes/Core/AppContext';

function makeContext(machineReadable: boolean): any {
    return {
        version: '4.0.0',
        isMachineReadableOutput: machineReadable,
        commandRegistry: {
            getCommands: () => ([
                {
                    signature: 'up',
                    options: {
                        alias: 'start',
                        description: 'starts the app',
                        options: [{ definition: '-f, --follow', description: 'follow', default: false }],
                        platforms: { windows: true, linux: true, darwin: true }
                    }
                },
                {
                    signature: 'npm <npmRunCommand> [otherArgs...]',
                    options: {
                        alias: 'run',
                        description: 'runs npm scripts',
                        options: [],
                        platforms: { windows: true, linux: true, darwin: true }
                    }
                },
                {
                    signature: 'weird-thing',
                    options: {
                        alias: '',
                        description: 'an ungrouped command',
                        options: [],
                        platforms: { windows: true, linux: true, darwin: true }
                    }
                }
            ])
        }
    };
}

describe('HelpCommand', () => {
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    it('prints a grouped, human readable overview', async () => {
        await new HelpCommand().execute({} as Command, makeContext(false) as AppContext);

        expect(logSpy).toHaveBeenCalledTimes(1);
        const out = logSpy.mock.calls[0][0] as string;

        expect(out).toContain('lab 4.0.0');
        expect(out).toContain('PREREQUISITES');
        expect(out).toContain('RUN & INSPECT YOUR APP');
        expect(out).toContain('up, start');
        // Commands not covered by a group still show up
        expect(out).toContain('OTHER COMMANDS');
        expect(out).toContain('weird-thing');
        // Worktree behaviour is documented
        expect(out).toContain('GIT WORKTREES');
    });

    it('prints a machine-readable JSON overview for scripts and AI agents', async () => {
        await new HelpCommand().execute({} as Command, makeContext(true) as AppContext);

        expect(logSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(logSpy.mock.calls[0][0] as string);

        expect(payload.name).toBe('lab');
        expect(payload.version).toBe('4.0.0');
        expect(payload.worktreeAware).toBe(true);

        const up = payload.commands.find((c: any) => c.name === 'up');
        expect(up.alias).toBe('start');
        expect(up.options).toHaveLength(1);
        expect(up.options[0].flag).toBe('-f, --follow');

        // The command name is extracted from the full signature
        const npm = payload.commands.find((c: any) => c.name === 'npm');
        expect(npm).toBeDefined();
        expect(npm.signature).toBe('npm <npmRunCommand> [otherArgs...]');
    });
});
