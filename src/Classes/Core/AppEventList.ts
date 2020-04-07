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
 * Last modified: 2020.04.03 at 19:01
 */

export enum AppEventList {
	
	/**
	 * Emitted to call the extension callbacks with option on promise handling
	 */
	EXTENSION_LOADING = "lab__internal--extensionLoading",
	
	/**
	 * Emitted after the extensions have been loaded
	 */
	AFTER_EXTENSIONS_LOADED = "lab__afterExtensions",
	
	/**
	 * Allows your extension script to handle migrations between app versions
	 */
	MIGRATE = "lab__migrate",
	
	/**
	 * Emitted right before an action is executed
	 */
	BEFORE_ACTION = "lab__action--before",
	
	/**
	 * Emitted right after an action was executed
	 */
	AFTER_ACTION = "lab__action--after",
	
	/**
	 * Emitted when a docker app is initialized, before the initialization takes place
	 */
	DOCKER_APP_BEFORE_INIT = "lab__dockerApp--beforeInit",
	
	/**
	 * Emitted when a docker app is initialized, after the .env file was checked for existence
	 */
	DOCKER_APP_AFTER_ENV_FILE_CHECK = "lab__dockerApp--afterEnvFileCheck",
	
	/**
	 * Emitted after the docker .env file was prepared with automatic values
	 * Can be used to apply custom defaults for your extension
	 */
	DOCKER_APP_AFTER_ENV_INIT = "lab__dockerApp--afterEnvInit",
	
	/**
	 * Emitted when a docker app is initialized, after the domain was written to the hosts file
	 */
	DOCKER_APP_AFTER_HOST_FILE_UPDATE = "lab__dockerApp--afterHostFileUpdate",
	
	/**
	 * Emitted when a docker app is initialized, after the required directories where created
	 */
	DOCKER_APP_AFTER_DIRECTORIES = "lab__dockerApp--afterDirectories",
	
	/**
	 * Emitted when a docker app is initialized, after the default service was selected
	 */
	DOCKER_APP_AFTER_DEFAULT_SERVICE = "lab__dockerApp--afterDefaultService",
	
	/**
	 * Emitted when a docker app is initialized, after the init process is completed
	 */
	DOCKER_APP_INIT_DONE = "lab__dockerApp--initDone"
}