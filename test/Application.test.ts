import chalk from 'chalk';
import {Application} from '../src/Classes/Core/Application';

describe('Application', () => {
    afterEach(() => {
        chalk.level = 0;
        jest.restoreAllMocks();
    });

    it('should skip the intro in machine-readable mode', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

        await (new Application() as any).showFancyIntro({
            isMachineReadableOutput: true,
            version: '1.0.0'
        });

        expect(logSpy).not.toHaveBeenCalled();
    });

    it('should disable chalk colors in machine-readable mode', async () => {
        chalk.level = 1;

        await (new Application() as any).prepareOutputMode({
            isMachineReadableOutput: true
        });

        expect(chalk.level).toBe(0);
    });
});
