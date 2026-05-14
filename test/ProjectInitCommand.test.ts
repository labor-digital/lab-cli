import { ProjectInitCommand } from '../src/Classes/Command/ProjectInitCommand';
import { AppContext } from '../src/Classes/Core/AppContext';
import { Command } from 'commander';
import * as fs from 'fs';
import {globSync} from 'glob';
import inquirer from 'inquirer';
import { Git } from '../src/Classes/Api/Git';
import { Bugfixes } from '../src/Classes/Core/Bugfixes';
import { ProjectNameInputWizard } from '../src/Classes/Core/Ui/ProjectNameInputWizard';

jest.mock('fs');
jest.mock('glob', () => ({
    __esModule: true,
    globSync: jest.fn()
}));
jest.mock('inquirer', () => ({
    __esModule: true,
    default: {
        prompt: jest.fn()
    }
}));
jest.mock('chalk', () => ({
    redBright: jest.fn((str) => str),
    greenBright: jest.fn((str) => str),
    yellow: jest.fn((str) => str),
}));
jest.mock('../src/Classes/Api/Git');
jest.mock('../src/Classes/Core/Bugfixes', () => ({
    Bugfixes: {
        inquirerChildProcessReadLineFix: jest.fn()
    }
}));
jest.mock('../src/Classes/Core/Ui/ProjectNameInputWizard');

describe('ProjectInitCommand', () => {
    let command: ProjectInitCommand;
    let mockCmd: any;
    let mockContext: any;
    let mockGitInstance: any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        command = new ProjectInitCommand();
        
        mockCmd = {
            name: jest.fn().mockReturnValue('init'),
            opts: jest.fn().mockReturnValue({})
        };
        
        mockContext = {
            cwd: '/mock/cwd',
            config: {
                get: jest.fn().mockReturnValue('git@github.com:mock/repo.git')
            }
        };

        mockGitInstance = {
            isInstalled: jest.fn().mockReturnValue(true),
            clone: jest.fn(),
            initializeRepo: jest.fn()
        };
        (Git as jest.Mock).mockImplementation(() => mockGitInstance);

        // Mock fs functions
        (fs.readdirSync as jest.Mock).mockReturnValue([]);
        (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
        (fs.rmSync as jest.Mock).mockImplementation(() => {});
        (fs.cpSync as jest.Mock).mockImplementation(() => {});
        (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            name: 'Mock Boilerplate',
            replaceProjectNameIn: ['test.txt']
        }));
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

        // Mock process.chdir
        jest.spyOn(process, 'chdir').mockImplementation(() => {});

        // Mock glob
        (globSync as jest.Mock).mockReturnValue(['/mock/cwd/.clone/lab.boilerplate.json']);

        // Mock ProjectNameInputWizard
        (ProjectNameInputWizard.run as jest.Mock).mockResolvedValue('mock-project-name');

        // Mock inquirer
        ((inquirer.prompt as unknown) as jest.Mock).mockResolvedValue({
            boilerplate: {
                name: 'Mock Boilerplate',
                path: '/mock/cwd/.clone',
                replaceProjectNameIn: ['test.txt']
            }
        });
        
        // Mock console.log to keep test output clean
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should execute successfully without arguments', async () => {
        await command.execute(mockCmd as Command, mockContext as AppContext);

        expect(Git).toHaveBeenCalledWith(mockContext);
        expect(mockGitInstance.isInstalled).toHaveBeenCalled();
        expect(fs.readdirSync).toHaveBeenCalledWith('/mock/cwd');
        expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/cwd/app', { recursive: true });
        expect(process.chdir).toHaveBeenCalledWith('/mock/cwd/app');
        expect(ProjectNameInputWizard.run).toHaveBeenCalled();
        expect(mockGitInstance.clone).toHaveBeenCalledWith('git@github.com:mock/repo.git', '/mock/cwd/.clone');
        expect(globSync).toHaveBeenCalledWith('**/lab.boilerplate.json', { absolute: true, cwd: '/mock/cwd/.clone' });
        expect(fs.cpSync).toHaveBeenCalled();
        expect(fs.unlinkSync).toHaveBeenCalled();
        expect(Bugfixes.inquirerChildProcessReadLineFix).toHaveBeenCalled();
        expect(mockGitInstance.initializeRepo).toHaveBeenCalledWith('/mock/cwd/app');
    });

    it('should execute successfully with arguments (force and boilerplate)', async () => {
        mockCmd.opts.mockReturnValue({
            force: true,
            boilerplate: 'PHP 8.4',
            name: 'my-project-name'
        });
        
        // Make directory not empty to test force
        (fs.readdirSync as jest.Mock).mockReturnValue(['some-file.txt']);
        
        // Override readFileSync mock for this test to match the boilerplate name
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            name: 'PHP 8.4',
            replaceProjectNameIn: ['test.txt']
        }));

        await command.execute(mockCmd as Command, mockContext as AppContext);

        expect(fs.rmSync).toHaveBeenCalledWith('/mock/cwd', { recursive: true, force: true });
        expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/cwd/app', { recursive: true });
        expect(ProjectNameInputWizard.run).toHaveBeenCalled();
        expect(mockGitInstance.clone).toHaveBeenCalledWith('git@github.com:mock/repo.git', '/mock/cwd/.clone');
        
        // Inquirer should not be called for boilerplate selection since it was provided
        expect(inquirer.prompt).not.toHaveBeenCalled();
        
        expect(fs.cpSync).toHaveBeenCalled();
        expect(mockGitInstance.initializeRepo).toHaveBeenCalledWith('/mock/cwd/app');
    });
});
