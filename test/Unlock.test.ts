import * as fs from 'fs';
import { Unlock, HELPER_PATH, SUDOERS_PATH } from '../src/Classes/Api/Unlock';
import { ElevatedProcess } from '../src/Classes/Api/ElevatedProcess';

jest.mock('fs');
jest.mock('os', () => ({ userInfo: () => ({ username: 'tester' }) }));
jest.mock('../src/Classes/Api/ElevatedProcess');

function ctx(platform: any): any {
    return {
        platform: {
            isDarwin: false, isLinux: false, isWindows: false,
            tempDirectory: '/tmp', choose: (o: any) => o.linux,
            ...platform
        }
    };
}

describe('Unlock', () => {
    let execMultiple: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        execMultiple = jest.fn();
        (ElevatedProcess as unknown as jest.Mock).mockImplementation(() => ({ execMultiple }));
        (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
        (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    it('is supported on macOS and Linux, not Windows', () => {
        expect(new Unlock(ctx({ isDarwin: true })).isSupported()).toBe(true);
        expect(new Unlock(ctx({ isLinux: true })).isSupported()).toBe(true);
        expect(new Unlock(ctx({ isWindows: true })).isSupported()).toBe(false);
    });

    it('helper script only allows loopback aliases and hosts copies', () => {
        const script = new Unlock(ctx({ isDarwin: true })).getHelperScript();
        expect(script).toContain('ifconfig lo0 alias');
        expect(script).toContain('127.*)');
        expect(script).toContain('cp "$src" /etc/hosts');
        expect(script).toContain('refusing alias for non-loopback');
    });

    it('sudoers content scopes NOPASSWD to the helper for the current user', () => {
        const content = new Unlock(ctx({ isDarwin: true })).getSudoersContent();
        expect(content).toContain('tester ALL=(root) NOPASSWD: ' + HELPER_PATH + ' *');
    });

    it('routes commands through the helper only when installed', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        const locked = new Unlock(ctx({ isDarwin: true }));
        expect(locked.aliasCommand('127.88.0.1')).toBe('sudo ifconfig lo0 alias 127.88.0.1');
        expect(locked.hostsCommand('/tmp/h')).toBeNull();

        (fs.existsSync as jest.Mock).mockReturnValue(true);
        const unlocked = new Unlock(ctx({ isDarwin: true }));
        expect(unlocked.aliasCommand('127.88.0.1')).toBe('sudo "' + HELPER_PATH + '" alias "127.88.0.1"');
        expect(unlocked.hostsCommand('/tmp/h')).toBe('sudo "' + HELPER_PATH + '" hosts "/tmp/h"');
    });

    it('install writes temp files and installs via a single visudo-validated elevated block', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        new Unlock(ctx({ isDarwin: true })).install();

        expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
        expect(execMultiple).toHaveBeenCalledTimes(1);
        const cmds = (execMultiple.mock.calls[0][0] as string[]).join('\n');
        expect(cmds).toContain('visudo -cf');
        expect(cmds).toContain(HELPER_PATH);
        expect(cmds).toContain(SUDOERS_PATH);
    });

    it('remove deletes the sudoers rule and helper via elevation', () => {
        new Unlock(ctx({ isDarwin: true })).remove();
        const cmds = (execMultiple.mock.calls[0][0] as string[]).join('\n');
        expect(cmds).toContain('rm -f "' + SUDOERS_PATH + '"');
        expect(cmds).toContain('rm -f "' + HELPER_PATH + '"');
    });
});
