import * as childProcess from 'child_process';
import { Git, sanitizeIdentitySuffix } from '../src/Classes/Api/Git';

jest.mock('child_process');

function makeContext() {
    return {
        rootDirectory: '/repo/app/',
        platform: {
            choose: (options: { windows: string; linux: string }) => options.linux
        }
    } as any;
}

/**
 * Routes a fully built "cd ... && git ..." command string to a canned answer.
 */
function mockGit(answers: { installed?: boolean; gitDir?: string; commonDir?: string; topLevel?: string; failRevParse?: boolean }) {
    (childProcess.execSync as jest.Mock).mockImplementation((cmd: string) => {
        if (cmd.indexOf('which git') !== -1 || cmd.indexOf('WHERE git') !== -1) {
            if (answers.installed === false) {
                throw new Error('git not found');
            }
            return Buffer.from('/usr/bin/git\n');
        }
        if (answers.failRevParse) {
            throw new Error('fatal: not a git repository');
        }
        if (cmd.indexOf('rev-parse --git-common-dir') !== -1) {
            return Buffer.from((answers.commonDir ?? '/repo/.git') + '\n');
        }
        if (cmd.indexOf('rev-parse --git-dir') !== -1) {
            return Buffer.from((answers.gitDir ?? '/repo/.git') + '\n');
        }
        if (cmd.indexOf('rev-parse --show-toplevel') !== -1) {
            return Buffer.from((answers.topLevel ?? '/repo') + '\n');
        }
        throw new Error('unexpected command: ' + cmd);
    });
}

describe('sanitizeIdentitySuffix', () => {
    it('keeps a simple directory name', () => {
        expect(sanitizeIdentitySuffix('pyongyang')).toBe('pyongyang');
    });
    it('lowercases and collapses non alphanumeric characters to dashes', () => {
        expect(sanitizeIdentitySuffix('Feature/Foo Bar')).toBe('feature-foo-bar');
    });
    it('trims leading and trailing separators', () => {
        expect(sanitizeIdentitySuffix('_weird__name_')).toBe('weird-name');
    });
});

describe('Git.getWorktreeInfo', () => {
    afterEach(() => jest.restoreAllMocks());

    it('detects a linked worktree and derives the suffix from the worktree directory name', () => {
        mockGit({
            gitDir: '/main/.git/worktrees/pyongyang',
            commonDir: '/main/.git',
            topLevel: '/work/pyongyang'
        });

        const info = new Git(makeContext()).getWorktreeInfo();

        expect(info.isWorktree).toBe(true);
        expect(info.name).toBe('pyongyang');
        expect(info.topLevel).toBe('/work/pyongyang');
        expect(info.mainWorkTreePath).toBe('/main');
    });

    it('reports the main checkout as NOT a worktree (git-dir equals common-dir)', () => {
        mockGit({ gitDir: '/repo/.git', commonDir: '/repo/.git' });

        const info = new Git(makeContext()).getWorktreeInfo();

        expect(info.isWorktree).toBe(false);
        expect(info.name).toBeNull();
    });

    it('fails safe when git is not installed', () => {
        mockGit({ installed: false });

        expect(new Git(makeContext()).getWorktreeInfo().isWorktree).toBe(false);
    });

    it('fails safe when the directory is not a git repository', () => {
        mockGit({ failRevParse: true });

        expect(new Git(makeContext()).getWorktreeInfo().isWorktree).toBe(false);
    });
});
