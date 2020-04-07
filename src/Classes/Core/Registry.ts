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
 * Last modified: 2020.04.04 at 20:40
 */

import {GenericStorage} from "@labor-digital/helferlein/lib/Entities/GenericStorage";
import {GenericStorageInterface} from "@labor-digital/helferlein/lib/Entities/GenericStorageInterface";
import {isEmpty} from "@labor-digital/helferlein/lib/Types/isEmpty";
import * as fs from "fs";
import * as path from "path";
import {AppContext} from "./AppContext";

export class Registry extends GenericStorage {
	
	/**
	 * The absolute path to the registry storage file
	 */
	protected _storageFile: string;
	
	/**
	 * @inheritDoc
	 */
	public set(key: string | number, value: any): GenericStorageInterface {
		this.loadStorageFromFile();
		super.set(key, value);
		const json = JSON.stringify(this.storage);
		fs.writeFileSync(this._storageFile, json);
		return this;
	}
	
	/**
	 * Initializes the registry object by loading the stored data of the json file
	 * @param context
	 */
	public initialize(context: AppContext): Registry {
		this._storageFile = path.join(context.platform.homeDirectory, "lab.registry.json");
		this.loadStorageFromFile();
		return this;
	}
	
	/**
	 * Loads the storage data from the registered storage file and rests it
	 */
	protected loadStorageFromFile(): void {
		let data = {};
		if (fs.existsSync(this._storageFile)) {
			try {
				const content = fs.readFileSync(this._storageFile).toString("utf-8");
				this.storage = JSON.parse(content);
				return;
			} catch (e) {
			}
		}
		if (isEmpty(this.storage)) this.storage = data;
	}
}