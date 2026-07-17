import { AppIdentity } from '../src/Classes/Core/DockerApp/AppIdentity';
import { WorktreeInfo } from '../src/Classes/Api/Git';

function makeEnv(values: Record<string, string>): any {
    return { get: (k: string, fb?: any) => (k in values ? values[k] : fb) };
}

function makeContext(worktree: WorktreeInfo, appRegStore: Record<string, any> = {}): any {
    const registry: any = {
        _v: { nextIp: 2136473601 } as Record<string, any>,
        get(k: string, fb: any) { return this._v[k] ?? fb; },
        set(k: string, v: any) { this._v[k] = v; }
    };
    const appRegistry = {
        get(k: string, fb?: any) { return k in appRegStore ? appRegStore[k] : fb; },
        set(k: string, v: any) { appRegStore[k] = v; }
    };
    return { worktree, config: { get: () => '.labor.systems' }, registry, appRegistry };
}

const WT: WorktreeInfo = { isWorktree: true, name: 'kathmandu', topLevel: '/w/kathmandu', mainWorkTreePath: '/main' };
const MAIN: WorktreeInfo = { isWorktree: false, name: null, topLevel: null, mainWorkTreePath: null };

describe('AppIdentity', () => {
    it('passes through the .env values for a plain main checkout', () => {
        const env = makeEnv({ COMPOSE_PROJECT_NAME: 'labor-website-frontend', APP_DOMAIN: 'lab-web-fro.labor.systems', APP_IP: '127.88.0.4' });
        const id = new AppIdentity(makeContext(MAIN), env).resolve();
        expect(id.isOverlay).toBe(false);
        expect(id.composeProjectName).toBe('labor-website-frontend');
        expect(id.appDomain).toBe('lab-web-fro.labor.systems');
        expect(id.appIp).toBe('127.88.0.4');
    });

    it('derives an isolated compose project, domain and a FRESH ip inside a worktree', () => {
        const env = makeEnv({ COMPOSE_PROJECT_NAME: 'labor-website-frontend', APP_DOMAIN: 'lab-web-fro.labor.systems', APP_IP: '127.88.0.4' });
        const store: Record<string, any> = {};
        const id = new AppIdentity(makeContext(WT, store), env).resolve();
        expect(id.isOverlay).toBe(true);
        expect(id.composeProjectName).toBe('labor-website-frontend-kathmandu');
        expect(id.appDomain).toBe('lab-web-fro-kat.labor.systems');
        // never reuses the main app's ip; allocates its own loopback ip and stores it
        expect(id.appIp).not.toBe('127.88.0.4');
        expect(id.appIp).toMatch(/^127\./);
        expect(store.worktreeIp).toBe(id.appIp);
    });

    it('reuses the worktree ip stored in the per-worktree registry (idempotent)', () => {
        const env = makeEnv({ COMPOSE_PROJECT_NAME: 'labor-website-frontend', APP_IP: '127.88.0.4' });
        const id = new AppIdentity(makeContext(WT, { worktreeIp: '127.88.9.9' }), env).resolve();
        expect(id.appIp).toBe('127.88.9.9');
    });

    it('does not double-apply the worktree suffix on re-runs', () => {
        const env = makeEnv({ COMPOSE_PROJECT_NAME: 'labor-website-frontend-kathmandu' });
        const id = new AppIdentity(makeContext(WT), env).resolve();
        expect(id.composeProjectName).toBe('labor-website-frontend-kathmandu');
    });

    it('honors explicit --domain / --ip overrides (even in a main checkout)', () => {
        const env = makeEnv({ COMPOSE_PROJECT_NAME: 'labor-website-frontend', APP_DOMAIN: 'lab-web-fro.labor.systems', APP_IP: '127.88.0.4' });
        const id = new AppIdentity(makeContext(MAIN), env, { domain: 'custom.test', ip: '127.88.5.5' }).resolve();
        expect(id.isOverlay).toBe(true);
        expect(id.appDomain).toBe('custom.test');
        expect(id.appIp).toBe('127.88.5.5');
    });
});
