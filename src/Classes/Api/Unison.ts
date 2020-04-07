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
 * Last modified: 2020.04.06 at 15:05
 */

import {isString} from "@labor-digital/helferlein/lib/Types/isString";
import * as childProcess from "child_process";
import * as fs from "fs";
import * as path from "path";
import {DockerApp} from "../Core/DockerApp/DockerApp";

export class Unison {
	
	/**
	 * Starts the unison sync for a given docker app
	 * @param app The docker app to run unison for
	 * @param force True to force unison to run without archives
	 */
	static startUnison(app: DockerApp, force?: boolean): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			// Prepare options
			const additionalArgs: string = app.context.config.get("union.additionalArgs", "").trim();
			const allowNodeModules: boolean = app.context.config.get("unison.allowNodeModules", false);
			const targetPort = app.context.config.get("unison.target.port", 5000);
			const targetIp = app.context.config.get("unison.target.ip", app.env.get("APP_IP"));
			let hostPath = app.context.config.get("unison.host.directory");
			if (!isString(hostPath)) {
				if (fs.existsSync(path.join(app.context.rootDirectory, "src")))
					hostPath = path.join(app.context.rootDirectory, "src");
				else hostPath = app.context.rootDirectory;
			}
			
			// Build the command
			const command = "\"" + Unison.getUnisonExecutable(app) + "\" \"" + hostPath + "\" " +
				"\"socket://" + targetIp + ":" + targetPort + "\" " +
				"-repeat=watch " +
				(allowNodeModules ? "" : "-ignore=\"Name node_modules\" ") +
				"-ignore=\"Name *.dev-symlink-bkp\" " +
				"-prefer=\"" + hostPath + "\" " +
				"-ignorecase=false " +
				"-auto " +
				"-links=false " +
				"-label=\"APP: " + app.context.rootDirectory + " \" " +
				(force ? "-ignorearchives=true -ignorelocks=true " : "") +
				" " + additionalArgs;
			
			try {
				childProcess.execSync(command, {stdio: "inherit"});
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}
	
	/**
	 * Returns the absolute path to the unison executable
	 * @param app
	 */
	protected static getUnisonExecutable(app: DockerApp): string {
		return path.join(app.context.cliDirectory, "bin/unison/unison 2.48.4 text.exe");
	}
}