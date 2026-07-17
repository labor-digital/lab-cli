import { DefaultCommands } from '../src/Classes/Core/Command/DefaultCommands';
import { AppContext } from '../src/Classes/Core/AppContext';

describe('DefaultCommands', () => {
    let mockContext: any;

    beforeEach(() => {
        mockContext = {
            commandRegistry: {
                registerCommand: jest.fn()
            },
            program: {
                on: jest.fn()
            },
            platform: {
                isWindows: false,
                isMac: true,
                isLinux: false
            },
            config: {
                get: jest.fn().mockReturnValue('bash')
            }
        };
    });

    it('should register all default commands', async () => {
        await DefaultCommands.make(mockContext as AppContext);

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'npm <npmRunCommand> [otherArgs...]',
            expect.stringContaining('NpmCommand'),
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'up',
            '../../Command/DockerComposeUpCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'stop',
            '../../Command/DockerComposeStopCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'logs',
            '../../Command/DockerComposeLogsCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'shell',
            '../../Command/DockerComposeShellCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'restart',
            '../../Command/DockerComposeRestartCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'down',
            '../../Command/DockerComposeDownCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'sync',
            '../../Command/DockerComposeUnisonCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'open',
            '../../Command/DockerComposeOpenCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'stop-all',
            '../../Command/DockerStopAllContainersCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'start-engine',
            '../../Command/DockerEngineStartCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'restart-engine',
            '../../Command/DockerEngineRestartCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'status',
            '../../Command/DockerComposeStatusCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'stop-engine',
            '../../Command/DockerEngineStopCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'import',
            '../../Command/ProjectImportCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'export',
            '../../Command/ProjectExportCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'init',
            '../../Command/ProjectInitCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'installCa',
            '../../Command/InstallCaCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'test',
            '../../Command/ProjectTestCommand',
            expect.any(Object)
        );

        expect(mockContext.commandRegistry.registerCommand).toHaveBeenCalledWith(
            'help',
            '../../Command/HelpCommand',
            expect.any(Object)
        );
    });
});
