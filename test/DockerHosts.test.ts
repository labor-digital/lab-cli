import * as fs from 'fs';
import { DockerHosts } from '../src/Classes/Core/DockerApp/DockerHosts';

jest.mock('fs');

function makeContext(rootDirectory = '/repo/app/'): any {
    return {
        rootDirectory,
        config: { get: (k: string) => (k === 'network.hostsFilePath' ? '/etc/hosts' : undefined) },
        platform: { choose: (o: any) => o.linux, isDarwin: false, isLinux: true, isWindows: false }
    };
}

const HOSTS = [
    '127.0.0.1 localhost',
    '127.88.0.4 lab-web-fro.labor.systems #lab-docker-app /Users/main/app/',
    '127.88.0.5 other.labor.systems #lab-docker-app /Users/other/app/'
].join('\n');

describe('DockerHosts Map-iteration regression (removeDomain / removeCurrent)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(HOSTS));
    });
    afterEach(() => jest.restoreAllMocks());

    it('removeDomain does not throw "Could not iterate given object!"', () => {
        const hosts = new DockerHosts(makeContext());
        expect(() => hosts.removeDomain('lab-web-fro.labor.systems')).not.toThrow();
    });

    it('removeCurrent does not throw (fixes lab down hosts cleanup)', () => {
        const hosts = new DockerHosts(makeContext('/Users/main/app/'));
        expect(() => hosts.removeCurrent()).not.toThrow();
    });
});
