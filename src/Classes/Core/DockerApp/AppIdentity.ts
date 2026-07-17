/*
 * Copyright 2020 LABOR.digital
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isString } from 'radashi';
import * as path from 'path';
import {Ip} from '../../Api/Ip';
import {AppContext} from '../AppContext';
import {DockerEnv} from './DockerEnv';

/**
 * The resolved network identity of an app: the compose project name, domain and
 * loopback ip that the docker composition should actually use.
 */
export interface AppIdentityValues
{
    composeProjectName: string;
    appDomain: string;
    appIp: string;

    /**
     * Worktree-relative overrides for the app's directory variables (APP_ROOT_DIR,
     * APP_WORKING_DIR, ...). Inside a worktree these repoint the container's
     * bind-mounts (code, .env.app, opt, data, ...) at the WORKTREE's own paths, so
     * the worktree app serves its own branch instead of the main checkout's code.
     * Empty for a plain main-checkout run.
     */
    dirs: Record<string, string>;

    /**
     * True when the values differ from the raw .env values and therefore have to
     * be injected into docker compose / hosts as an overlay (git worktree or
     * explicit --domain/--ip overrides). False for a plain main-checkout run.
     */
    isOverlay: boolean;
}

export interface AppIdentityOverrides
{
    domain?: string;
    ip?: string;
}

/**
 * Resolves the effective network identity of an app.
 *
 * For a normal main checkout this is simply what the .env file says. Inside a
 * git worktree (or when --domain/--ip are given) it derives an ISOLATED identity
 * - its own compose project, domain and loopback ip - so the worktree app can
 * run side by side with the main checkout. These overlay values are NOT written
 * back to .env (which may be committed or read-only); they are injected at
 * runtime, keeping the worktree's git tree clean.
 */
export class AppIdentity
{
    protected _context: AppContext;
    protected _env: DockerEnv;
    protected _overrides: AppIdentityOverrides;

    public constructor(context: AppContext, env: DockerEnv, overrides?: AppIdentityOverrides)
    {
        this._context = context;
        this._env = env;
        this._overrides = overrides || {};
    }

    public resolve(): AppIdentityValues
    {
        const baseName = this._env.get('COMPOSE_PROJECT_NAME', '') as string;
        const baseDomain = this._env.get('APP_DOMAIN', '') as string;
        const baseIp = this._env.get('APP_IP', '') as string;

        const worktree = this._context.worktree;
        const domainOverride = this._overrides.domain;
        const ipOverride = this._overrides.ip;

        // Nothing to overlay: plain main-checkout run without explicit overrides.
        if (!worktree.isWorktree && !domainOverride && !ipOverride) {
            return {composeProjectName: baseName, appDomain: baseDomain, appIp: baseIp, dirs: {}, isOverlay: false};
        }

        // Compose project: suffix with the worktree name (idempotent).
        const suffix = worktree.isWorktree && worktree.name ? '-' + worktree.name : '';
        const stripped = suffix && baseName.toLowerCase().endsWith(suffix.toLowerCase())
            ? baseName.substr(0, baseName.length - suffix.length)
            : baseName;
        const composeProjectName = suffix ? stripped + suffix : baseName;

        return {
            composeProjectName: composeProjectName,
            appDomain: domainOverride || (worktree.isWorktree ? this.deriveDomain(composeProjectName) : baseDomain),
            appIp: ipOverride || (worktree.isWorktree ? this.resolveWorktreeIp() : baseIp),
            dirs: worktree.isWorktree ? this.resolveWorktreeDirs() : {},
            isOverlay: true
        };
    }

    /**
     * Repoints the app's directory variables at the CURRENT worktree so the
     * container bind-mounts the worktree's own code / config instead of the main
     * checkout's. Uses the same layout as a main checkout (see DockerAppInit), but
     * rooted at this worktree. Only variables the app actually declares in .env are
     * returned, so we never inject mounts the composition does not use.
     */
    protected resolveWorktreeDirs(): Record<string, string>
    {
        const root = this._context.rootDirectory;
        const parent = path.join(root, '..');
        const sep = path.sep;
        const candidates: Record<string, string> = {
            APP_ROOT_DIR: root,
            APP_PARENT_DIR: parent + sep,
            APP_WORKING_DIR: path.join(root, 'src') + sep,
            APP_DATA_DIR: path.join(parent, 'data') + sep,
            APP_LOG_DIR: path.join(parent, 'logs') + sep,
            APP_IMPORT_DIR: path.join(parent, 'import') + sep,
            APP_SSH_DIR: path.join(parent, 'ssh') + sep,
            APP_OPT_DIR: path.join(root, 'opt') + sep
        };

        const dirs: Record<string, string> = {};
        Object.keys(candidates).forEach(key => {
            if (this._env.has(key)) {
                dirs[key] = candidates[key];
            }
        });
        return dirs;
    }

    /**
     * Builds a domain from the (short form of the) compose project name, matching
     * how the main checkout's domain is generated.
     */
    protected deriveDomain(projectName: string): string
    {
        const shortName = projectName
            .trim()
            .split('-')
            .map(v => v.replace(/_/, '').trim().substr(0, 3))
            .join('_')
            .toLowerCase();
        return encodeURI(shortName).replace(/_/g, '-') + this._context.config.get('network.domain.base');
    }

    /**
     * Returns a stable, unique loopback ip for the current worktree. It is
     * allocated once from the global ip counter and cached in the per-worktree
     * registry, so re-runs keep the same ip and never reuse the main app's ip.
     */
    protected resolveWorktreeIp(): string
    {
        const stored = this._context.appRegistry.get('worktreeIp');
        if (isString(stored) && stored !== '') {
            return stored;
        }

        let nextIp = this._context.registry.get('nextIp', 2136473601);
        // Handle legacy IP value @todo remove in next major release
        if (nextIp >= 127088000001) {
            nextIp = Ip.ip2long(Ip.legacy2ip(nextIp));
        }
        const ip = Ip.long2ip(++nextIp) + '';
        this._context.registry.set('nextIp', nextIp);
        this._context.appRegistry.set('worktreeIp', ip);
        return ip;
    }
}
