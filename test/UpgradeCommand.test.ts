import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {Command} from 'commander';
import UpgradeCommand, {UpgradeStep, UpgradeStepError} from '../src/Classes/Command/UpgradeCommand';

type RecordedStep = {
    step: UpgradeStep;
    command: string;
    args: Array<string>;
    cwd: string;
};

class InspectableUpgradeCommand extends UpgradeCommand
{
    public latestVersion: string = '1.6.0';
    public executedSteps: Array<RecordedStep> = [];
    public failingStep: UpgradeStep | null = null;
    public failingStderr: string = 'Simulated step failure';

    protected async fetchLatestFactoryCoreVersion(): Promise<string>
    {
        return this.latestVersion;
    }

    protected async executeStep(
        step: UpgradeStep,
        command: string,
        args: Array<string>,
        cwd: string
    ): Promise<{stdout: string, stderr: string}>
    {
        this.executedSteps.push({step, command, args, cwd});

        if (this.failingStep === step) {
            throw new UpgradeStepError(step, this.getStepErrorMessage(step), this.failingStderr);
        }

        return {
            stdout: '',
            stderr: ''
        };
    }
}

describe('UpgradeCommand', () => {
    let command: InspectableUpgradeCommand;
    let workingDirectory: string;
    let stdoutWriteSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        command = new InspectableUpgradeCommand();
        workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-cli-upgrade-command-'));
        stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true as any);
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
        stdoutWriteSpy.mockRestore();
        consoleLogSpy.mockRestore();
        fs.rmSync(workingDirectory, {recursive: true, force: true});
    });

    function makeContext(): any
    {
        return {
            cwd: workingDirectory + path.sep
        };
    }

    function makeCommand(options: {json?: boolean, target?: string} = {json: true}): Command
    {
        return {
            opts: jest.fn().mockReturnValue(options)
        } as unknown as Command;
    }

    function writeFactoryJson(payload: unknown): void
    {
        fs.writeFileSync(path.join(workingDirectory, 'factory.json'), JSON.stringify(payload, null, 2) + '\n');
    }

    function createProjectStructure(lockfile: 'npm' | 'pnpm' | 'yarn' | 'none' = 'npm'): void
    {
        fs.mkdirSync(path.join(workingDirectory, 'backend'), {recursive: true});
        fs.mkdirSync(path.join(workingDirectory, 'frontend'), {recursive: true});

        switch (lockfile) {
            case 'pnpm':
                fs.writeFileSync(path.join(workingDirectory, 'frontend', 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
                break;
            case 'yarn':
                fs.writeFileSync(path.join(workingDirectory, 'frontend', 'yarn.lock'), '# yarn lockfile\n');
                break;
            case 'npm':
                fs.writeFileSync(path.join(workingDirectory, 'frontend', 'package-lock.json'), '{}\n');
                break;
            default:
                break;
        }
    }

    function parseLastJsonPayload(): any
    {
        const calls = stdoutWriteSpy.mock.calls;
        expect(calls.length).toBe(1);
        expect(calls[0][0]).toBe(JSON.stringify(JSON.parse(calls[0][0] as string)) + '\n');
        return JSON.parse(calls[0][0] as string);
    }

    it('should upgrade successfully with an explicit target version', async () => {
        writeFactoryJson({
            core_version: '1.5.0',
            active_components: ['hero']
        });
        createProjectStructure('npm');

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'success',
            previous_version: '1.5.0',
            new_version: '1.6.0',
            message: 'Core upgraded and database migrated successfully.'
        });
        expect(command.executedSteps).toEqual([
            {
                step: 'backend_composer_require',
                command: 'composer',
                args: ['require', 'my-agency/factory-core:1.6.0', '--with-all-dependencies'],
                cwd: path.join(workingDirectory, 'backend')
            },
            {
                step: 'frontend_dependency_install',
                command: 'npm',
                args: ['install', '@my-agency/factory-nuxt-layer@1.6.0'],
                cwd: path.join(workingDirectory, 'frontend')
            },
            {
                step: 'backend_database_updateschema',
                command: 'vendor/bin/typo3',
                args: ['database:updateschema'],
                cwd: path.join(workingDirectory, 'backend')
            }
        ]);
        expect(JSON.parse(fs.readFileSync(path.join(workingDirectory, 'factory.json')).toString('utf-8'))).toEqual({
            core_version: '1.6.0',
            active_components: ['hero']
        });
    });

    it('should resolve the latest version when no target flag was supplied', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('npm');
        command.latestVersion = '1.7.0';

        await command.execute(makeCommand({json: true}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'success',
            previous_version: '1.5.0',
            new_version: '1.7.0',
            message: 'Core upgraded and database migrated successfully.'
        });
        expect(command.executedSteps[0].args).toEqual(['require', 'my-agency/factory-core:1.7.0', '--with-all-dependencies']);
    });

    it('should return noop when the target version equals the current version', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('npm');

        await command.execute(makeCommand({json: true, target: '1.5.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'noop',
            previous_version: '1.5.0',
            new_version: '1.5.0',
            message: 'Already up to date.'
        });
        expect(command.executedSteps).toEqual([]);
    });

    it('should return noop when the target version is lower than the current version', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('npm');

        await command.execute(makeCommand({json: true, target: '1.4.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'noop',
            previous_version: '1.5.0',
            new_version: '1.5.0',
            message: 'Already up to date.'
        });
        expect(command.executedSteps).toEqual([]);
    });

    it('should return an error when factory.json is missing', async () => {
        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'error',
            previous_version: null,
            new_version: null,
            message: 'factory.json not found in current working directory.'
        });
    });

    it('should return an error when factory.json contains an invalid current version', async () => {
        writeFactoryJson({
            core_version: 'invalid-version'
        });

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'error',
            previous_version: null,
            new_version: null,
            message: 'Invalid factory.json configuration.'
        });
    });

    it('should return an error when the target version is invalid', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('npm');

        await command.execute(makeCommand({json: true, target: 'not-a-version'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'error',
            previous_version: '1.5.0',
            new_version: null,
            message: 'Invalid target version.'
        });
        expect(command.executedSteps).toEqual([]);
    });

    it('should return an error when the backend directory is missing', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        fs.mkdirSync(path.join(workingDirectory, 'frontend'), {recursive: true});

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'error',
            previous_version: '1.5.0',
            new_version: '1.6.0',
            message: 'backend directory not found in current working directory.'
        });
    });

    it('should detect pnpm lockfiles for the frontend upgrade step', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('pnpm');

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(command.executedSteps[1]).toEqual({
            step: 'frontend_dependency_install',
            command: 'pnpm',
            args: ['add', '@my-agency/factory-nuxt-layer@1.6.0'],
            cwd: path.join(workingDirectory, 'frontend')
        });
    });

    it('should detect yarn lockfiles for the frontend upgrade step', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('yarn');

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(command.executedSteps[1]).toEqual({
            step: 'frontend_dependency_install',
            command: 'yarn',
            args: ['add', '@my-agency/factory-nuxt-layer@1.6.0'],
            cwd: path.join(workingDirectory, 'frontend')
        });
    });

    it('should fall back to npm when no supported frontend lockfile is present', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('none');

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(command.executedSteps[1]).toEqual({
            step: 'frontend_dependency_install',
            command: 'npm',
            args: ['install', '@my-agency/factory-nuxt-layer@1.6.0'],
            cwd: path.join(workingDirectory, 'frontend')
        });
    });

    it('should return a structured error when the backend composer step fails', async () => {
        writeFactoryJson({
            core_version: '1.5.0',
            active_components: ['hero']
        });
        createProjectStructure('npm');
        command.failingStep = 'backend_composer_require';
        command.failingStderr = 'Composer could not resolve dependencies';

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'error',
            previous_version: '1.5.0',
            new_version: '1.6.0',
            message: 'Backend composer update failed.',
            failed_step: 'backend_composer_require',
            stderr: 'Composer could not resolve dependencies'
        });
        expect(JSON.parse(fs.readFileSync(path.join(workingDirectory, 'factory.json')).toString('utf-8'))).toEqual({
            core_version: '1.5.0',
            active_components: ['hero']
        });
    });

    it('should return a structured error when the frontend install step fails', async () => {
        writeFactoryJson({
            core_version: '1.5.0',
            active_components: ['hero']
        });
        createProjectStructure('npm');
        command.failingStep = 'frontend_dependency_install';
        command.failingStderr = 'npm ERR missing peer dependency';

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'error',
            previous_version: '1.5.0',
            new_version: '1.6.0',
            message: 'Frontend dependency install failed.',
            failed_step: 'frontend_dependency_install',
            stderr: 'npm ERR missing peer dependency'
        });
        expect(command.executedSteps.map(step => step.step)).toEqual([
            'backend_composer_require',
            'frontend_dependency_install'
        ]);
        expect(JSON.parse(fs.readFileSync(path.join(workingDirectory, 'factory.json')).toString('utf-8'))).toEqual({
            core_version: '1.5.0',
            active_components: ['hero']
        });
    });

    it('should return a structured error when the schema migration step fails', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('npm');
        command.failingStep = 'backend_database_updateschema';
        command.failingStderr = 'Unknown database column definition';

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(parseLastJsonPayload()).toEqual({
            status: 'error',
            previous_version: '1.5.0',
            new_version: '1.6.0',
            message: 'Database migration failed.',
            failed_step: 'backend_database_updateschema',
            stderr: 'Unknown database column definition'
        });
    });

    it('should emit strict JSON only when json mode is enabled', async () => {
        writeFactoryJson({
            core_version: '1.5.0'
        });
        createProjectStructure('npm');

        await command.execute(makeCommand({json: true, target: '1.6.0'}), makeContext(), {} as any);

        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(stdoutWriteSpy.mock.calls[0][0]).toBe(
            '{"status":"success","previous_version":"1.5.0","new_version":"1.6.0","message":"Core upgraded and database migrated successfully."}\n'
        );
    });
});
