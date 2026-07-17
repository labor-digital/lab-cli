import { Command } from 'commander';
import { UnlockCommand } from '../src/Classes/Command/UnlockCommand';
import { AppContext } from '../src/Classes/Core/AppContext';
import { Unlock } from '../src/Classes/Api/Unlock';

jest.mock('../src/Classes/Api/Unlock');

describe('UnlockCommand', () => {
    let mockUnlock: any;
    const cmd = {} as Command;
    const ctx = {} as AppContext;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        mockUnlock = {
            isSupported: jest.fn().mockReturnValue(true),
            isInstalled: jest.fn().mockReturnValue(false),
            install: jest.fn(),
            remove: jest.fn()
        };
        (Unlock as unknown as jest.Mock).mockImplementation(() => mockUnlock);
    });
    afterEach(() => jest.restoreAllMocks());

    it('unlock installs when supported and not yet unlocked', async () => {
        await new UnlockCommand().execute(cmd, ctx);
        expect(mockUnlock.install).toHaveBeenCalled();
    });

    it('unlock warns and does nothing on an unsupported platform', async () => {
        mockUnlock.isSupported.mockReturnValue(false);
        await new UnlockCommand().execute(cmd, ctx);
        expect(mockUnlock.install).not.toHaveBeenCalled();
    });

    it('unlock skips install when already unlocked', async () => {
        mockUnlock.isInstalled.mockReturnValue(true);
        await new UnlockCommand().execute(cmd, ctx);
        expect(mockUnlock.install).not.toHaveBeenCalled();
    });

    it('lock removes when unlocked', async () => {
        mockUnlock.isInstalled.mockReturnValue(true);
        await new UnlockCommand().lock(cmd, ctx);
        expect(mockUnlock.remove).toHaveBeenCalled();
    });

    it('lock does nothing when not unlocked', async () => {
        mockUnlock.isInstalled.mockReturnValue(false);
        await new UnlockCommand().lock(cmd, ctx);
        expect(mockUnlock.remove).not.toHaveBeenCalled();
    });
});
