/*
 * Copyright 2019 LABOR.digital
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
 */
const fs = require("fs");
const path = require("path");

// tsc emits lib/index.js without the executable bit. The npm "bin" entry needs
// it to be executable so the "lab" symlink works when installing directly from
// git. Restore it on every build so it never gets lost again.
// (chmod is a harmless no-op on Windows.)
const entry = path.join(__dirname, "lib", "index.js");
try {
	if (fs.existsSync(entry)) {
		fs.chmodSync(entry, 0o755);
	}
} catch (e) {
	console.error("Failed to mark lib/index.js as executable!", e);
}
