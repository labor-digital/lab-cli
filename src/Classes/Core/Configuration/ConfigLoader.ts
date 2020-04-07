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
 * Last modified: 2020.04.03 at 19:42
 */

import {PlainObject} from "@labor-digital/helferlein/lib/Interfaces/PlainObject";
import {forEach} from "@labor-digital/helferlein/lib/Lists/forEach";
import {merge} from "@labor-digital/helferlein/lib/Lists/merge";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import {AppContext} from "../AppContext";
import {Config} from "./Config";
import {DefaultConfig} from "./DefaultConfig";

export class ConfigLoader {
	
	/**
	 * Factory to create the configuration for the given context
	 *
	 * @param context
	 */
	public load(context: AppContext): Config {
		// Initialize default config
		let config = DefaultConfig.make(context);
		
		// Try to load global config
		const configFileName = "lab.config.json";
		const globalConfigPath = context.platform.homeDirectory + configFileName;
		config = merge(config, this.loadConfigFile(globalConfigPath));
		
		// Load project config
		forEach([
			context.rootDirectory + configFileName,
			path.join(context.rootDirectory, "..", configFileName)
		], (filename: string) => {
			config = merge(config, this.loadConfigFile(filename));
		});
		
		// Load directory config if there is one and we are not in the cwd
		// (as it would have been handled by the project config lookup already)
		if (context.rootDirectory !== context.cwd) {
			const dirConfigPath = context.cwd + configFileName;
			config = merge(config, this.loadConfigFile(dirConfigPath));
		}
		
		// Wrap the config into the config object
		return new Config(config);
	}
	
	/**
	 * Internal helper to load the content of a given configuration file and return the contents
	 * @param filename
	 */
	protected loadConfigFile(filename: string): PlainObject {
		if (!fs.existsSync(filename)) return {};
		try {
			const content = fs.readFileSync(filename).toString("utf-8");
			return JSON.parse(content);
		} catch (e) {
			console.log(chalk.redBright("Failed to load config file: " + filename));
			return {};
		}
	}
}