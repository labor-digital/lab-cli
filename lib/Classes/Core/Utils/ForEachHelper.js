"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forEach = forEach;
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
 *
 * Last modified: 2019.01.10 at 10:02
 */
const radashi_1 = require("radashi");
const breaker = new Error();
breaker.breaker = true;
/**
 * Loops over arrays or objects and applies a given callback
 *
 * Will work with Arrays, Objects, Map, Set and interators
 *
 * @param list The array or object to iterate
 * @param callback The callback to apply. Params are: (value, key, iteratedObject)
 */
function forEach(list, callback) {
    if ((0, radashi_1.isNullish)(list)) {
        return;
    }
    let _k = 0;
    // Fast lane for arrays
    if ((0, radashi_1.isArray)(list)) {
        for (_k = 0; _k < (list).length; _k++) {
            // @ts-ignore
            if (callback(list[_k], _k, list) === false) {
                break;
            }
        }
        return;
    }
    if ((0, radashi_1.isObject)(list) || (0, radashi_1.isFunction)(list)) {
        // Handle for-each functions on sets and maps
        if (typeof list.forEach === 'function') {
            const objectIsSet = (0, radashi_1.isSet)(list);
            try {
                list.forEach((v, k) => {
                    if (callback(v, objectIsSet ? _k : k, list) === false) {
                        throw breaker;
                    }
                    ++_k;
                });
            }
            catch (e) {
                if (e.breaker !== true) {
                    throw e;
                }
            }
            return;
        }
        // Handle iterators
        // @ts-ignore
        if ((0, radashi_1.isObject)(list) && typeof list[Symbol.iterator] === 'function') {
            let it = list[Symbol.iterator]();
            if ((0, radashi_1.isFunction)(it.next)) {
                for (let nextValue = it.next(); !nextValue.done; nextValue = it.next()) {
                    if (callback(nextValue.value, _k++, list) === false) {
                        break;
                    }
                }
            }
            return;
        }
        // Handle object iteration
        if ((0, radashi_1.isFunction)(list.hasOwnProperty)) {
            for (_k in list) {
                if (list.hasOwnProperty(_k)) {
                    // Try to translate string keys
                    let kReal = _k;
                    if (typeof _k === 'string') {
                        let kInt;
                        let kFloat;
                        if ((kInt = parseInt(_k)) + '' === _k) {
                            kReal = kInt;
                        }
                        else if ((kFloat = parseFloat(_k)) + '' === _k) {
                            kReal = kFloat;
                        }
                    }
                    // @ts-ignore
                    if (callback(list[_k], kReal, list) === false) {
                        break;
                    }
                }
            }
            return;
        }
    }
    throw Error('Could not iterate given object!');
}
//# sourceMappingURL=ForEachHelper.js.map