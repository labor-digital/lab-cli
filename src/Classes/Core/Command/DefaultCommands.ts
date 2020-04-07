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
 * Last modified: 2020.04.05 at 18:43
 */

import path from "path";
import {AppContext} from "../AppContext";

export class DefaultCommands {
	public static make(context: AppContext): Promise<AppContext> {
		context.commandRegistry.registerCommand(
			"npm <npmRunCommand> [otherArgs...]",
			path.normalize(path.join(__dirname, "../../Command/NpmCommand")),
			{
				alias: "run",
				description: "works like \"npm run\" would, but is aware of the current app's directory structure. Works also with period prefix, like: \"lab .watch\"",
				onRegistration: () => {
					// Make commander listen to our "." prefix for npm commands
					context.program.on("command:*", function (args) {
						if (typeof args[0] !== "string") return;
						if (args[0].charAt(0) !== ".") return;
						args[0] = args[0].replace(/^\./, "");
						context.program.parse([
							process.argv[0], process.argv[1], "run", ...args
						]);
					});
				}
			})
		;
		
		context.commandRegistry.registerCommand("up", "../../Command/DockerComposeUpCommand", {
			alias: "start",
			description: "starts and restarts the current project composition (docker-compose up)",
			options: [
				{
					definition: "-f, --follow",
					description: "follows the output of your app like docker-compose does",
					default: false
				},
				{
					definition: "-p, --pull",
					description: "forces docker-compose to pull the newest image versions before starting the application",
					default: false
				},
				...(context.platform.isWindows ? [
					{
						definition: "-w, --separateWindow",
						description: "opens the app's docker process in a new window",
						default: false
					}
				] : [])
			]
		});
		
		context.commandRegistry.registerCommand("stop", "../../Command/DockerComposeStopCommand", {
			description: "stops the current application (docker-compose stop)",
			options: [
				{
					definition: "-f, --force",
					description: "force kills the application instead of stopping it",
					default: false
				}
			]
		});
		
		context.commandRegistry.registerCommand("logs", "../../Command/DockerComposeLogsCommand", {
			description: "displays the tail of your app container's log (docker-compose logs)",
			options: [
				{
					definition: "-l, --lines <lines>",
					description: "the number of lines from the end of each container log to display (default: 15). Use \"all\" for the whole log",
					validation: /all|[0-9]+/,
					default: 15
				}, {
					definition: "-f, --follow",
					description: "follows the log output automatically",
					default: false
				}
			]
		});
		
		context.commandRegistry.registerCommand("shell", "../../Command/DockerComposeShellCommand", {
			alias: "sh",
			description: "attaches you to the shell of the current apps master container, or one of the running child containers",
			options: [
				{
					definition: "--shell <shell>",
					description: "used to define the shell to attach to",
					default: context.config.get("docker.shell", "bash")
				},
				{
					definition: "-s, --select",
					description: "shows a prompt to select which container to attach to",
					default: false
				}
			]
		});
		
		context.commandRegistry.registerCommand("restart", "../../Command/DockerComposeRestartCommand", {
			description: "performs a hard restart of the current project composition (docker-compose stop && docker-compose up)"
		});
		
		context.commandRegistry.registerCommand("down", "../../Command/DockerComposeDownCommand", {
			description: "destroys the current app's containers and removes their images if required (docker-compose down)"
		});
		
		context.commandRegistry.registerCommand("sync", "../../Command/DockerComposeUnisonCommand", {
			description: "runs a unison sync into your application. Useful if the volume-mount is to slow!",
			options: [
				{
					definition: "--force",
					description: "runs unison sync without any archives. This can be useful if there was a mess-up in a previous run",
					default: false
				}
			]
		});
		
		context.commandRegistry.registerCommand("open", "../../Command/DockerComposeOpenCommand", {
			description: "opens the current apps main container in your default browser window"
		});
		
		context.commandRegistry.registerCommand("stop-all", "../../Command/DockerStopAllContainersCommand", {
			description: "stops >ALL< currently running container instances"
		});
		
		context.commandRegistry.registerCommand("start-engine", "../../Command/DockerEngineStartCommand", {
			description: "starts the docker engine, if it is currently not running"
		});
		
		context.commandRegistry.registerCommand("restart-engine", "../../Command/DockerEngineRestartCommand", {
			description: "restarts the docker engine"
		});
		
		context.commandRegistry.registerCommand("status", "../../Command/DockerComposeStatusCommand", {
			alias: "ps",
			description: "checks if the app is currently running or not"
		});
		
		context.commandRegistry.registerCommand("stop-engine", "../../Command/DockerEngineStopCommand", {
			description: "stops the docker engine, if it is currently running",
			options: [
				{
					definition: "--force",
					description: "Can be used to ignore the current 'running' state of the engine",
					default: false
				}
			]
		});
		
		return Promise.resolve(context);
	}
}