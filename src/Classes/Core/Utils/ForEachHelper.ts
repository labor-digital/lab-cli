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
import {isArray, isFunction, isNullish, isObject, isSet} from 'radashi';

export interface PlainObject<V = any>
{
    [key: string]: V
}
export type List<V = any, K = any, T = Array<V> | Set<V> | Map<K, V> | PlainObject<V>> = T;
export type ReadList<V = any, K = any, T = List<V, K> | Iterable<V>> = T;

export interface ForEachCallback<V = any, K = any> extends Function
{
    /**
     * Is called for every element of the iterated object
     * @param value The current value
     * @param key The current key
     * @param iteratedObject The iterated object
     */
    (value: V, key: K, iteratedObject: ReadList<V, K>): boolean | any
}

interface BreakErrorType
{
    breaker?: boolean;
}

const breaker = new Error() as BreakErrorType;
breaker.breaker = true;

/**
 * Loops over arrays or objects and applies a given callback
 *
 * Will work with Arrays, Objects, Map, Set and interators
 *
 * @param list The array or object to iterate
 * @param callback The callback to apply. Params are: (value, key, iteratedObject)
 */
export function forEach<V = any, K = any>(list: ReadList<V, K>, callback: ForEachCallback<V, K>): void
{
    if (isNullish(list)) {
        return;
    }
    
    let _k: any = 0;
    
    // Fast lane for arrays
    if (isArray(list)) {
        for (_k = 0; _k < (list).length; _k++) {
            // @ts-ignore
            if (callback(list[_k], _k, list) === false) {
                break;
            }
        }
        return;
    }
    
    if (isObject(list) || isFunction(list)) {
        
        // Handle for-each functions on sets and maps
        if (typeof (list as any).forEach === 'function') {
            const objectIsSet = isSet(list);
            try {
                (list as any).forEach((v: V, k: K) => {
                    if (callback(v, objectIsSet ? _k : k, list) === false) {
                        throw breaker;
                    }
                    ++_k;
                });
            } catch (e) {
                if (e.breaker !== true) {
                    throw e;
                }
            }
            return;
        }
        
        // Handle iterators
        // @ts-ignore
        if (isObject(list) && typeof list[Symbol.iterator] === 'function') {
            let it: Iterator<V> = (list as Iterable<V>)[Symbol.iterator]();
            if (isFunction(it.next)) {
                for (let nextValue = it.next(); !nextValue.done; nextValue = it.next()) {
                    if (callback(nextValue.value, _k++ as any, list) === false) {
                        break;
                    }
                }
            }
            return;
        }
        
        // Handle object iteration
        if (isFunction(list.hasOwnProperty)) {
            for (_k in list) {
                if (list.hasOwnProperty(_k)) {
                    // Try to translate string keys
                    let kReal: string | number = _k;
                    if (typeof _k === 'string') {
                        let kInt: number;
                        let kFloat: number;
                        if ((kInt = parseInt(_k)) + '' === _k) {
                            kReal = kInt;
                        } else if ((kFloat = parseFloat(_k)) + '' === _k) {
                            kReal = kFloat;
                        }
                    }
                    
                    // @ts-ignore
                    if (callback(list[_k], kReal as any, list) === false) {
                        break;
                    }
                }
            }
            return;
        }
    }
    
    throw Error('Could not iterate given object!');
}