import { DockerAppInit } from '../src/Classes/Core/DockerApp/DockerAppInit';
import { WorktreeInfo } from '../src/Classes/Api/Git';

// In-memory backing store shared by all DockerEnv instances created during a test.
const mockEnvStore = new Map<string, string>();
const mockWriteTemplate = jest.fn();

jest.mock('../src/Classes/Core/DockerApp/DockerEnv', () => ({
    DockerEnv: class {
        constructor(_path: string) {}
        has(k: string) { return mockEnvStore.has(k); }
        get(k: string, fb?: any) { return mockEnvStore.has(k) ? mockEnvStore.get(k) : fb; }
        set(k: string, v: any) { mockEnvStore.set(k, String(v)); return this; }
        getAll() { const o: Record<string, string> = {}; mockEnvStore.forEach((v, k) => { o[k] = v; }); return o; }
    }
}));

jest.mock('../src/Classes/Core/DockerApp/DockerEnvTemplate', () => ({
    DockerEnvTemplate: jest.fn().mockImplementation(() => ({ writeTemplate: mockWriteTemplate }))
}));

function makeContext(worktree: any) {
    return {
        rootDirectory: '/repo/app/',
        worktree,
        registry: { get: jest.fn((_k: string, fb: any) => fb), set: jest.fn() },
        config: { get: jest.fn(() => '.project.dev.local') }
    } as any;
}

function makeApp() {
    return { env: null as any, doppler: {}, acceptDefaults: true } as any;
}

function makeInit(worktree: any) {
    return new DockerAppInit('docker-compose.yml', makeContext(worktree), makeApp());
}

const WORKTREE: WorktreeInfo = { isWorktree: true, name: 'pyongyang', topLevel: '/work/pyongyang', mainWorkTreePath: '/main' };
const MAIN: WorktreeInfo = { isWorktree: false, name: null, topLevel: null, mainWorkTreePath: null };

describe('DockerAppInit worktree identity isolation', () => {
    beforeEach(() => {
        mockEnvStore.clear();
        mockWriteTemplate.mockClear();
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    it('does NOT rewrite identity in .env inside a worktree (identity is a runtime overlay)', async () => {
        mockEnvStore.set('COMPOSE_PROJECT_NAME', 'my-project');
        mockEnvStore.set('APP_DOMAIN', 'my-pro.project.dev.local');
        mockEnvStore.set('DOPPLER_PROJECT', 'null'); // "null" is treated as empty by the init

        await (makeInit(WORKTREE) as any).fillEmptyValuesInEnvFile();

        // .env keeps the base values (git stays clean); the worktree gets its own
        // compose project / domain / ip from AppIdentity at runtime instead.
        expect(mockEnvStore.get('COMPOSE_PROJECT_NAME')).toBe('my-project');
        expect(mockEnvStore.get('APP_DOMAIN')).toBe('my-pro.project.dev.local');
        expect(mockEnvStore.has('APP_IP')).toBe(false);
        // Doppler stays on the base so the worktree shares the main checkout's secrets.
        expect(mockEnvStore.get('DOPPLER_PROJECT')).toBe('my_pro');
    });

    it('generates domain and ip in a main checkout when they are empty', async () => {
        mockEnvStore.set('COMPOSE_PROJECT_NAME', 'my-project');
        mockEnvStore.set('DOPPLER_PROJECT', 'null');

        await (makeInit(MAIN) as any).fillEmptyValuesInEnvFile();

        expect(mockEnvStore.get('COMPOSE_PROJECT_NAME')).toBe('my-project');
        expect(mockEnvStore.get('APP_DOMAIN')).toBe('my-pro.project.dev.local');
        expect(mockEnvStore.get('APP_IP')).toBeTruthy();
        expect(mockEnvStore.get('DOPPLER_PROJECT')).toBe('my_pro');
    });

    it('does not rewrite an existing domain outside a worktree', async () => {
        mockEnvStore.set('COMPOSE_PROJECT_NAME', 'my-project');
        mockEnvStore.set('APP_DOMAIN', 'my-pro.project.dev.local');

        await (makeInit(MAIN) as any).fillEmptyValuesInEnvFile();

        expect(mockEnvStore.get('APP_DOMAIN')).toBe('my-pro.project.dev.local');
    });

    it('skips .env.template regeneration inside a worktree', async () => {
        await (makeInit(WORKTREE) as any).generateEnvTemplateFile('.env');
        expect(mockWriteTemplate).not.toHaveBeenCalled();
    });

    it('regenerates .env.template outside a worktree', async () => {
        await (makeInit(MAIN) as any).generateEnvTemplateFile('.env');
        expect(mockWriteTemplate).toHaveBeenCalled();
    });
});
