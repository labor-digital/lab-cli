import { Command } from 'commander';
import inquirer from 'inquirer';
import { DockerComposeDownCommand } from '../src/Classes/Command/DockerComposeDownCommand';
import { DockerStopAllContainersCommand } from '../src/Classes/Command/DockerStopAllContainersCommand';
import { DockerComposeOpenCommand } from '../src/Classes/Command/DockerComposeOpenCommand';
import { AppContext } from '../src/Classes/Core/AppContext';
import { CommandStack } from '../src/Classes/Core/Command/CommandStack';
import { DockerApp } from '../src/Classes/Core/DockerApp/DockerApp';
import { Docker } from '../src/Classes/Api/Docker';

jest.mock('../src/Classes/Core/DockerApp/DockerApp');
jest.mock('../src/Classes/Api/Docker');

function cmdWith(opts: any): Command {
    return { name: () => 'x', opts: () => opts } as unknown as Command;
}

describe('non-interactive --yes (agent friendliness)', () => {
    let mockApp: any;
    let mockDocker: any;
    const ctx = {
        rootDirectory: '/mock/root',
        appRegistry: { get: () => ({}), set: () => {} }
    } as unknown as AppContext;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => undefined);

        mockApp = {
            acceptDefaults: false,
            initialize: jest.fn().mockImplementation(() => Promise.resolve(mockApp)),
            env: { get: (_k: string, fb?: any) => fb },
            dockerCompose: {
                isRunning: true,
                down: jest.fn().mockResolvedValue(undefined)
            }
        };
        (DockerApp as unknown as jest.Mock).mockImplementation(() => mockApp);

        mockDocker = { stopAllContainers: jest.fn().mockResolvedValue(undefined) };
        (Docker as unknown as jest.Mock).mockImplementation(() => mockDocker);
    });

    afterEach(() => jest.restoreAllMocks());

    it('down --yes destroys the app without prompting and sets acceptDefaults', async () => {
        await new DockerComposeDownCommand().execute(cmdWith({ yes: true }), ctx);

        expect(inquirer.prompt).not.toHaveBeenCalled();
        expect(mockApp.dockerCompose.down).toHaveBeenCalled();
        expect(mockApp.acceptDefaults).toBe(true);
    });

    it('down without --yes falls back to the interactive prompt', async () => {
        await new DockerComposeDownCommand().execute(cmdWith({}), ctx);

        expect(inquirer.prompt).toHaveBeenCalled();
    });

    it('stop-all --yes stops all containers without prompting', async () => {
        await new DockerStopAllContainersCommand().execute(cmdWith({ yes: true }), ctx);

        expect(inquirer.prompt).not.toHaveBeenCalled();
        expect(mockDocker.stopAllContainers).toHaveBeenCalled();
    });

    it('open --yes auto-starts a stopped app (queues up -y / open) without prompting', async () => {
        mockApp.dockerCompose.isRunning = false;
        const stack = { push: jest.fn() } as unknown as CommandStack;

        await new DockerComposeOpenCommand().execute(cmdWith({ yes: true }), ctx, stack);

        expect(inquirer.prompt).not.toHaveBeenCalled();
        expect((stack.push as jest.Mock)).toHaveBeenCalledWith(['up', '-y']);
        expect((stack.push as jest.Mock)).toHaveBeenCalledWith(['open', '-y']);
    });
});
