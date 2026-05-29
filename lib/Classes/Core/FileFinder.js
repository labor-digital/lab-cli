"use strict";
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
exports.FileFinder = void 0;
const ForEachHelper_1 = require("./Utils/ForEachHelper");
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
 *
 * Last modified: 2020.04.04 at 12:48
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DockerApp_1 = require("./DockerApp/DockerApp");
class FileFinder {
    /**
     * Searches a valid root directory to look up other files and directories with
     * @param context
     */
    findRootDirectory(context) {
        let rootDirectory = null;
        // Build the lookup list for all docker related files
        (0, ForEachHelper_1.forEach)(DockerApp_1.DockerApp.dockerComposeRootFiles, (file) => {
            rootDirectory = this.findFileInCwd(context, file);
            if ((rootDirectory === null)) {
                return;
            }
            return false;
        });
        // Try to find package.json if we did not find a docker file
        if ((rootDirectory === null)) {
            rootDirectory = this.findFileInCwd(context, 'package.json');
        }
        // Try to find a app config file if we still have nothing
        if ((rootDirectory === null)) {
            rootDirectory = this.findFileInCwd(context, 'lab.config.json');
        }
        // Return the current working directory if we did not find a root directory
        if ((rootDirectory === null)) {
            return context.cwd;
        }
        return rootDirectory + path.sep;
    }
    /**
     * Tries to find the package json file path based on the given context
     * @param context
     */
    findPackageJson(context) {
        // Check if there is an src directory
        let packageJson = path.join(context.rootDirectory, 'src', 'package.json');
        if (fs.existsSync(packageJson)) {
            return packageJson;
        }
        // Check if we can find it in the root directory
        packageJson = path.join(context.rootDirectory, 'package.json');
        if (fs.existsSync(packageJson)) {
            return packageJson;
        }
        // Check if we can find it in the cwd
        return path.join(this.findFileInCwd(context, 'package.json'), 'package.json');
    }
    /**
     * Tries to find a file with a given name in the current working directory by traversing upwards through the structure
     * @param context
     * @param filename
     */
    findFileInCwd(context, filename) {
        const cwdParts = context.cwd.split(/[\/\\]/g);
        const minDepth = context.platform.isWindows ? 1 : 0;
        const pathPrefix = context.platform.isWindows ? '' : path.sep;
        while (cwdParts.length > minDepth) {
            cwdParts.pop();
            let pathLocal = pathPrefix + path.join(...cwdParts);
            if (context.platform.isWindows && cwdParts.length === 1) {
                pathLocal =
                    pathLocal.substr(0, pathLocal.length - 1) + path.sep;
            }
            const lookupFile = path.join(pathLocal, filename);
            if (!fs.existsSync(lookupFile)) {
                continue;
            }
            return pathLocal;
        }
        return null;
    }
}
exports.FileFinder = FileFinder;
//# sourceMappingURL=FileFinder.js.map