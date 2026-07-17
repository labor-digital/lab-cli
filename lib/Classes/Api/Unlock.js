"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unlock = exports.SUDOERS_PATH = exports.HELPER_PATH = exports.HELPER_DIR = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const ElevatedProcess_1 = require("./ElevatedProcess");
/**
 * Absolute path of the root-owned helper script that performs lab's privileged
 * operations. It is intentionally NOT below the (user-writable) npm install dir.
 */
exports.HELPER_DIR = '/usr/local/lib/lab-cli';
exports.HELPER_PATH = exports.HELPER_DIR + '/lab-elevate.sh';
exports.SUDOERS_PATH = '/etc/sudoers.d/lab-cli';
/**
 * Manages the optional "unlock" state of the CLI: a scoped, passwordless sudo
 * rule that lets lab run its privileged setup (the macOS loopback alias and the
 * hosts-file write) WITHOUT a password prompt - so the CLI can be driven
 * non-interactively, e.g. by an AI agent that has no access to the shell.
 *
 * Security model: a root-owned helper script (not user-writable) performs only
 * two tightly validated actions, and the sudoers rule grants NOPASSWD for ONLY
 * that helper. The user opts in with "lab unlock" (one password prompt) and can
 * revert with "lab lock".
 */
class Unlock {
    constructor(context) {
        this._context = context;
    }
    /**
     * The unlock mechanism relies on sudo + sudoers and is therefore only
     * available on macOS and Linux. On Windows lab uses a UAC prompt instead.
     */
    isSupported() {
        return this._context.platform.isDarwin || this._context.platform.isLinux;
    }
    /**
     * True if lab has been unlocked (the root-owned helper is installed). We only
     * probe the helper - the sudoers file in /etc/sudoers.d is usually not
     * readable by a normal user.
     */
    isInstalled() {
        try {
            return fs.existsSync(exports.HELPER_PATH);
        }
        catch (e) {
            return false;
        }
    }
    /**
     * The shell command lab uses to add the macOS loopback alias. When unlocked it
     * goes through the passwordless helper, otherwise through a plain (prompting) sudo.
     */
    aliasCommand(ip) {
        return this.isInstalled()
            ? 'sudo "' + exports.HELPER_PATH + '" alias "' + ip + '"'
            : 'sudo ifconfig lo0 alias ' + ip;
    }
    /**
     * The shell command lab uses to copy the prepared hosts file onto the system
     * hosts file. Returns null when unlock is not active (callers keep their own
     * fallback, e.g. the elevated multi-command used on Windows).
     */
    hostsCommand(sourceFile) {
        return this.isInstalled()
            ? 'sudo "' + exports.HELPER_PATH + '" hosts "' + sourceFile + '"'
            : null;
    }
    /**
     * The content of the root-owned helper script. It performs ONLY the two
     * privileged actions lab needs and validates its input, so that a NOPASSWD
     * rule pointing at it cannot be abused to run arbitrary commands as root.
     */
    getHelperScript() {
        return [
            '#!/bin/sh',
            '# Managed by lab-cli. Do not edit.',
            '# Reinstall with "lab unlock", remove with "lab lock".',
            'set -e',
            'action="$1"',
            'case "$action" in',
            '  alias)',
            '    ip="$2"',
            '    # Only ever add loopback (127.0.0.0/8) aliases - never a routable ip.',
            '    case "$ip" in',
            '      127.*) exec ifconfig lo0 alias "$ip" ;;',
            '      *) echo "lab-elevate: refusing alias for non-loopback ip: $ip" >&2; exit 1 ;;',
            '    esac',
            '    ;;',
            '  hosts)',
            '    src="$2"',
            '    # Only copy an existing regular file onto the hosts file.',
            '    if [ -f "$src" ]; then exec cp "$src" /etc/hosts; fi',
            '    echo "lab-elevate: hosts source not found: $src" >&2; exit 1',
            '    ;;',
            '  *)',
            '    echo "lab-elevate: unknown action: $action" >&2; exit 1',
            '    ;;',
            'esac',
            ''
        ].join('\n');
    }
    /**
     * The content of the /etc/sudoers.d/lab-cli drop-in. Grants the current user
     * passwordless sudo for ONLY the lab helper (the helper itself is what limits
     * the actual privileged actions).
     */
    getSudoersContent() {
        return [
            '# Managed by lab-cli. Remove with "lab lock".',
            this.getUser() + ' ALL=(root) NOPASSWD: ' + exports.HELPER_PATH + ' *',
            ''
        ].join('\n');
    }
    /**
     * The current user name the sudoers rule is written for.
     */
    getUser() {
        return os.userInfo().username;
    }
    /**
     * Installs the helper + sudoers rule. Requires a single elevated prompt.
     * The sudoers file is validated with "visudo -c" BEFORE it is activated, so a
     * malformed rule can never break sudo.
     */
    install() {
        const tmp = this._context.platform.tempDirectory;
        const helperTmp = path.join(tmp, 'lab-elevate.sh');
        const sudoersTmp = path.join(tmp, 'lab-cli.sudoers');
        fs.writeFileSync(helperTmp, this.getHelperScript());
        fs.writeFileSync(sudoersTmp, this.getSudoersContent());
        (new ElevatedProcess_1.ElevatedProcess(this._context)).execMultiple([
            'set -e',
            'mkdir -p "' + exports.HELPER_DIR + '"',
            'cp "' + helperTmp + '" "' + exports.HELPER_PATH + '"',
            'chown 0:0 "' + exports.HELPER_PATH + '"',
            'chmod 755 "' + exports.HELPER_PATH + '"',
            'cp "' + sudoersTmp + '" "' + exports.SUDOERS_PATH + '.tmp"',
            'chown 0:0 "' + exports.SUDOERS_PATH + '.tmp"',
            'chmod 440 "' + exports.SUDOERS_PATH + '.tmp"',
            'if visudo -cf "' + exports.SUDOERS_PATH + '.tmp"; then mv "' + exports.SUDOERS_PATH + '.tmp" "' + exports.SUDOERS_PATH +
                '"; else rm -f "' + exports.SUDOERS_PATH + '.tmp"; echo "lab: sudoers validation failed, aborting" >&2; exit 1; fi'
        ]);
        try {
            fs.unlinkSync(helperTmp);
            fs.unlinkSync(sudoersTmp);
        }
        catch (e) {
            // best effort cleanup
        }
    }
    /**
     * Removes the helper + sudoers rule. Requires a single elevated prompt.
     */
    remove() {
        (new ElevatedProcess_1.ElevatedProcess(this._context)).execMultiple([
            'rm -f "' + exports.SUDOERS_PATH + '"',
            'rm -f "' + exports.HELPER_PATH + '"',
            'rmdir "' + exports.HELPER_DIR + '" 2>/dev/null || true'
        ]);
    }
}
exports.Unlock = Unlock;
//# sourceMappingURL=Unlock.js.map