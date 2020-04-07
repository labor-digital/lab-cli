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
 * Last modified: 2020.04.06 at 14:14
 */
import * as readline from "readline";

export class Bugfixes {
	/**
	 * Implemented because there is an issue when inquirer is used in
	 * combination with childProcess's that require inputs
	 */
	static inquirerChildProcessReadLineFix() {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.close();
	}
}
