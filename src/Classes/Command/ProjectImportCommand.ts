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
 * Last modified: 2020.05.08 at 12:06
 */

import {AbstractImportExportCommand} from "./AbstractImportExportCommand";

export class ProjectImportCommand extends AbstractImportExportCommand {
	public constructor() {
		super();
		this._actionFileName = "do_import";
		this._consentMessage = "This will trigger an import for your app: \"%s\". This will override all current container-data. Do you want to proceed?";
	}
}