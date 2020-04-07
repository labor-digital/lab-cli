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
 * Last modified: 2020.04.06 at 19:30
 */

import * as childProcess from "child_process";
import {Command} from "commander";
import inquirer from "inquirer";
import {AppContext} from "../Core/AppContext";
import {Bugfixes} from "../Core/Bugfixes";
import {CommandStack} from "../Core/Command/CommandStack";
import {DockerApp} from "../Core/DockerApp/DockerApp";

export class DockerComposeOpenCommand {
	public execute(cmd: Command, context: AppContext, stack: CommandStack): Promise<void> {
		return (new DockerApp(context)).initialize().then(app => {
			if (!app.dockerCompose.isRunning) return this.askToStartContainer(context, stack);
			
			const domain = app.env.get("APP_DOMAIN", app.env.get("APP_IP"));
			const protocol = app.env.get("APP_PROTOCOL", "http://");
			const url = protocol + domain;
			
			console.log("Opening website \"" + url + "\" in your default browser!");
			const command = context.platform.choose({
				windows: () => {
					return "start \"\" \"" + url + "\"";
				},
				linux: () => {
					return "xdg-open " + url;
				}
			})();
			
			childProcess.execSync(command);
		});
	}
	
	/**
	 * Asks the user to start the container
	 * @param context
	 * @param stack
	 */
	protected askToStartContainer(context: AppContext, stack: CommandStack): Promise<void> {
		return new Promise((resolve, reject) => {
			inquirer.prompt({
				name: "startApp",
				type: "confirm",
				message: "Can't open your app, because it is currently not running! Should I start it for you?"
			}).then((answers) => {
				Bugfixes.inquirerChildProcessReadLineFix();
				if (!answers.startApp) return reject(new Error("The app has to be running before you can open it!"));
				stack.push(["up"]);
				stack.push(["open"]);
				resolve();
			});
		});
	}
}