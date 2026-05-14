import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {Command} from 'commander';
import {FactoryAddCommand} from '../src/Classes/Command/FactoryAddCommand';
import {fetchComponentManifest} from '../src/Classes/Core/Factory/ComponentManifest';

jest.mock('../src/Classes/Core/Factory/ComponentManifest', () => ({
    fetchComponentManifest: jest.fn()
}));

describe('FactoryAddCommand', () => {
    let command: FactoryAddCommand;
    let workingDirectory: string;
    let stdoutWriteSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        command = new FactoryAddCommand();
        workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-cli-factory-add-'));
        stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true as any);
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
        (fetchComponentManifest as jest.Mock).mockResolvedValue({
            news: {version: '1.8.0'},
            hero: {version: '1.0.0'}
        });
    });

    afterEach(() => {
        stdoutWriteSpy.mockRestore();
        consoleLogSpy.mockRestore();
        processExitSpy.mockRestore();
        fs.rmSync(workingDirectory, {recursive: true, force: true});
    });

    function makeContext(): any
    {
        return {
            cwd: workingDirectory + path.sep
        };
    }

    function makeCommand(name: string | null, json: boolean = true): Command
    {
        return {
            args: name === null ? [] : [name],
            processedArgs: name === null ? [] : [name],
            opts: jest.fn().mockReturnValue({json})
        } as unknown as Command;
    }

    function writeFactoryJson(payload: unknown): void
    {
        fs.writeFileSync(path.join(workingDirectory, 'factory.json'), JSON.stringify(payload, null, 2) + '\n');
    }

    function writeComposerJson(): void
    {
        fs.writeFileSync(path.join(workingDirectory, 'composer.json'), '{}');
    }

    function writePackageJson(): void
    {
        fs.writeFileSync(path.join(workingDirectory, 'package.json'), '{}');
    }

    function lastJsonPayload(): any
    {
        const calls = stdoutWriteSpy.mock.calls;
        expect(calls.length).toBe(1);
        expect(calls[0][0]).toBe(JSON.stringify(JSON.parse(calls[0][0] as string)) + '\n');
        return JSON.parse(calls[0][0] as string);
    }

    it('should return an error if the component is not found in the manifest', async () => {
        writeFactoryJson({
            core_version: '1.5.0',
            active_components: ['hero']
        });
        writeComposerJson();

        await command.execute('gallery', makeContext(), {} as any, makeCommand('gallery'));

        expect(lastJsonPayload()).toEqual({
            status: 'error',
            message: 'Component not found in factory manifest.'
        });
    });

    it('should return requires_update if the component requires a newer core version', async () => {
        writeFactoryJson({
            core_version: '1.5.0',
            active_components: []
        });
        writeComposerJson();

        await command.execute('news', makeContext(), {} as any, makeCommand('news'));

        expect(lastJsonPayload()).toEqual({
            status: 'requires_update',
            component: 'news',
            current_core_version: '1.5.0',
            required_core_version: '1.8.0',
            message: 'Update required. Run lab upgrade.'
        });

        expect(JSON.parse(fs.readFileSync(path.join(workingDirectory, 'factory.json')).toString('utf-8'))).toEqual({
            core_version: '1.5.0',
            active_components: []
        });
    });

    it('should add the component and update factory.json on success', async () => {
        writeFactoryJson({
            core_version: '1.8.0',
            active_components: ['hero']
        });
        writeComposerJson();

        await command.execute('news', makeContext(), {} as any, makeCommand('news'));

        expect(lastJsonPayload()).toEqual({
            status: 'success',
            context: 'backend',
            component: 'news',
            installed: []
        });

        expect(JSON.parse(fs.readFileSync(path.join(workingDirectory, 'factory.json')).toString('utf-8'))).toEqual({
            core_version: '1.8.0',
            active_components: ['hero', 'news']
        });
    });

    it('should return success without rewriting factory.json when the component is already active', async () => {
        writeFactoryJson({
            core_version: '1.8.0',
            active_components: ['hero']
        });
        writeComposerJson();
        const before = fs.readFileSync(path.join(workingDirectory, 'factory.json')).toString('utf-8');

        await command.execute('hero', makeContext(), {} as any, makeCommand('hero'));

        expect(lastJsonPayload()).toEqual({
            status: 'success',
            context: 'backend',
            component: 'hero',
            installed: []
        });
        expect(fs.readFileSync(path.join(workingDirectory, 'factory.json')).toString('utf-8')).toBe(before);
    });

    it('should return an error when factory.json is missing', async () => {
        writeComposerJson();
        await command.execute('hero', makeContext(), {} as any, makeCommand('hero'));

        expect(lastJsonPayload()).toEqual({
            status: 'error',
            message: 'factory.json not found. Please provide the path using the --factory flag.'
        });
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should return an error when factory.json is invalid', async () => {
        writeFactoryJson({
            core_version: 'invalid-version',
            active_components: []
        });
        writeComposerJson();

        await command.execute('hero', makeContext(), {} as any, makeCommand('hero'));

        expect(lastJsonPayload()).toEqual({
            status: 'error',
            message: 'Invalid factory.json configuration.'
        });
    });

    it('should emit strict JSON only when json mode is enabled', async () => {
        writeFactoryJson({
            core_version: '1.8.0',
            active_components: []
        });
        writeComposerJson();

        await command.execute('hero', makeContext(), {} as any, makeCommand('hero', true));

        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).not.toHaveBeenCalled();
        expect(stdoutWriteSpy.mock.calls[0][0]).toBe('{"status":"success","context":"backend","component":"hero","installed":[]}\n');
    });

    it('should return an error if neither composer.json nor package.json exists', async () => {
        writeFactoryJson({
            core_version: '1.8.0',
            active_components: []
        });

        await command.execute('hero', makeContext(), {} as any, makeCommand('hero'));

        expect(lastJsonPayload()).toEqual({
            status: 'error',
            message: 'Could not determine project context. Please run this command inside a specific app directory containing either composer.json or package.json (but not both).'
        });
    });

    it('should return an error if both composer.json and package.json exist', async () => {
        writeFactoryJson({
            core_version: '1.8.0',
            active_components: []
        });
        writeComposerJson();
        writePackageJson();

        await command.execute('hero', makeContext(), {} as any, makeCommand('hero'));

        expect(lastJsonPayload()).toEqual({
            status: 'error',
            message: 'Could not determine project context. Please run this command inside a specific app directory containing either composer.json or package.json (but not both).'
        });
    });
});
