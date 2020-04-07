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
 * Last modified: 2020.04.03 at 20:08
 */
import * as os from "os";
import * as path from "path";
import {CommandPlatformDefinition} from "../Core/Command/CommandRegistry";

interface PlatformDefinition {
	windows?: any;
	darwin?: any;
	linux?: any;
}

export class Platform {
	
	/**
	 * The current platform/os identifier
	 */
	protected _platform: "WIN32" | "LINUX" | "DARWIN";
	
	/**
	 * Platform constructor
	 */
	public constructor() {
		this._platform = os.platform().toUpperCase() as any;
	}
	
	/**
	 * Returns the name of the currently used platform
	 */
	public get platform(): "WIN32" | "LINUX" | "DARWIN" {
		return this._platform;
	};
	
	/**
	 * Returns true if the current operating system is windows
	 */
	public get isWindows(): boolean {
		return this._platform === "WIN32";
	}
	
	/**
	 * Returns true if the current operating system is linux
	 */
	public get isLinux(): boolean {
		return this._platform === "LINUX";
	};
	
	/**
	 * Returns true if the current operating system is darwin / OSX
	 */
	public get isDarwin(): boolean {
		return this._platform === "DARWIN";
	}
	
	/**
	 * Chooses one of the given values/callbacks for the current operating system.
	 *
	 * @param definition
	 * @param useLinuxAsDarwinFallback Set to false to disable automatic fallback of OSX (darwin)
	 * definitions to Linux definitions if not explicitly set
	 * @return Function
	 */
	public choose(definition: PlatformDefinition, useLinuxAsDarwinFallback?: boolean) {
		if (this.isWindows && typeof definition.windows !== "undefined")
			return definition.windows;
		else if (this.isDarwin && typeof definition.darwin !== "undefined")
			return definition.darwin;
		else if (useLinuxAsDarwinFallback !== false && this.isDarwin && typeof definition.linux !== "undefined")
			return definition.linux;
		else if (this.isLinux && typeof definition.linux !== "undefined")
			return definition.linux;
		throw new Error("Function definition missing for platform: " + this._platform);
	}
	
	/**
	 * Checks if a given command platform definition is supported by the current platform specification
	 * @param definition
	 */
	public isCommandSupported(definition: CommandPlatformDefinition): boolean {
		if (this.isWindows && definition.windows) return true;
		if (this.isLinux && definition.linux) return true;
		return this.isDarwin && definition.darwin;
	}
	
	/**
	 * Returns the absolute path to the user home directory with a tailing slash
	 */
	public get homeDirectory(): string {
		return os.homedir() + path.sep;
	}
	
	/**
	 * Returns the absolute path to the temporary directory with a tailing slash
	 */
	public get tempDirectory(): string {
		return os.tmpdir() + path.sep;
	}
	
	/**
	 * Returns true if the operating system supports 64bit scripts
	 */
	public is64Bit(): boolean {
		return os.arch() === "x64";
	}
}