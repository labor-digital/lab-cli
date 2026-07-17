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
 *
 * Last modified: 2020.05.08 at 12:06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectImportCommand = void 0;
const AbstractImportExportCommand_1 = require("./AbstractImportExportCommand");
class ProjectImportCommand extends AbstractImportExportCommand_1.AbstractImportExportCommand {
    constructor() {
        super();
        this._actionFileName = 'do_import';
        this._consentMessage
            = 'This will trigger an import for your app: "%s". This will override all current container-data. Do you want to proceed?';
    }
}
exports.ProjectImportCommand = ProjectImportCommand;
//# sourceMappingURL=ProjectImportCommand.js.map