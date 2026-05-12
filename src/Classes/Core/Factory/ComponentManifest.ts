/*
 * Copyright 2026 LABOR.digital
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

import {UserError} from '../Error/UserError';

export interface FactoryComponentManifestEntry
{
    version: string;
    composer_dependencies?: string[];
    npm_dependencies?: string[];
    [key: string]: any;
}

export interface FactoryComponentManifest
{
    [componentName: string]: FactoryComponentManifestEntry;
}

/**
 * Reads `<cwd>/../factory-core/manifest.json`. In a Factory-scaffolded project
 * the parent of the cwd (`backend/app/` or `frontend/app/`) has a `factory-core`
 * symlink to the monorepo's `factory-core/` directory, so this resolves.
 *
 * If the file is missing or unreadable we throw a UserError immediately —
 * earlier versions silently fell back to a near-empty hardcoded manifest
 * (`{news, hero}`), which made every downstream `factory:add` for any other
 * component fail with the misleading "Component not found in factory manifest"
 * even though the real problem was a missing / wrong cwd.
 */
export function fetchComponentManifest(cwd: string): Promise<FactoryComponentManifest>
{
    const fs = require('fs');
    const path = require('path');
    const manifestPath = path.resolve(cwd, '../factory-core/manifest.json');

    if (!fs.existsSync(manifestPath)) {
        return Promise.reject(new UserError(
            `Factory component manifest not found at ${manifestPath}. ` +
            `Run \`factory:*\` from a scaffolded project's \`backend/app/src\` or \`frontend/app/src\` ` +
            `(the parent directory must contain a \`factory-core\` symlink to the monorepo's factory-core/).`
        ));
    }

    try {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return Promise.reject(new UserError(
                `Factory component manifest at ${manifestPath} is not a JSON object.`
            ));
        }
        return Promise.resolve(parsed as FactoryComponentManifest);
    } catch (e) {
        return Promise.reject(new UserError(
            `Failed to parse Factory component manifest at ${manifestPath}: ${(e as Error).message}`
        ));
    }
}
