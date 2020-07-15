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
 * Last modified: 2020.07.15 at 22:00
 */

export class Ip
{
    /**
     * Converts the legacy ip storage into a ip format
     * @param legacyIp
     */
    public static legacy2ip(legacyIp: number): string
    {
        return (legacyIp + '').match(/.{1,3}/g).map((v) => parseInt(v) + '').join('.');
    }
    
    /**
     * Converts an IP format into a integer value
     * @see http://navioo.com/javascript/tutorials/Javascript_long2ip_1544.html
     * @param argIP
     */
    public static ip2long(argIP: string): number | boolean
    {
        //  discuss at: https://locutus.io/php/ip2long/
        // original by: Waldo Malqui Silva (https://waldo.malqui.info)
        // improved by: Victor
        //  revised by: fearphage (https://my.opera.com/fearphage/)
        //  revised by: Theriault (https://github.com/Theriault)
        //    estarget: es2015
        //   example 1: ip2long('192.0.34.166')
        //   returns 1: 3221234342
        //   example 2: ip2long('0.0xABCDEF')
        //   returns 2: 11259375
        //   example 3: ip2long('255.255.255.256')
        //   returns 3: false
        
        let i = 0;
        // PHP allows decimal, octal, and hexadecimal IP components.
        // PHP allows between 1 (e.g. 127) to 4 (e.g 127.0.0.1) components.
        
        const pattern = new RegExp([
            '^([1-9]\\d*|0[0-7]*|0x[\\da-f]+)',
            '(?:\\.([1-9]\\d*|0[0-7]*|0x[\\da-f]+))?',
            '(?:\\.([1-9]\\d*|0[0-7]*|0x[\\da-f]+))?',
            '(?:\\.([1-9]\\d*|0[0-7]*|0x[\\da-f]+))?$'
        ].join(''), 'i');
        
        let argIPParts: Array<any> = argIP.match(pattern); // Verify argIP format.
        if (!argIPParts) {
            // Invalid format.
            return false;
        }
        
        // Reuse argIP variable for component counter.
        argIPParts[0] = 0;
        for (i = 1; i < 5; i += 1) {
            argIPParts[0] += !!((argIPParts[i] || '').length);
            argIPParts[i] = parseInt(argIPParts[i]) || 0;
        }
        // Continue to use argIP for overflow values.
        // PHP does not allow any component to overflow.
        argIPParts.push(256, 256, 256, 256);
        
        // Recalculate overflow of last component supplied to make up for missing components.
        argIPParts[4 + argIPParts[0]] *= Math.pow(256, 4 - argIPParts[0]);
        if (argIPParts[1] >= argIPParts[5] ||
            argIPParts[2] >= argIPParts[6] ||
            argIPParts[3] >= argIPParts[7] ||
            argIPParts[4] >= argIPParts[8]) {
            return false;
        }
        
        return argIPParts[1] * ((argIPParts[0] === 1 || 16777216) as number) +
               argIPParts[2] * ((argIPParts[0] <= 2 || 65536) as number) +
               argIPParts[3] * ((argIPParts[0] <= 3 || 256) as number) +
               argIPParts[4] * 1;
    }
    
    /**
     * Converts an (IPv4) Internet network address into a string in Internet standard dotted format
     * @see http://navioo.com/javascript/tutorials/Javascript_long2ip_1544.html
     * @param proper_address
     */
    public static long2ip(proper_address: number): string | false
    {
        // version: 812.316
        // discuss at: http://phpjs.org/functions/long2ip
        // +   original by: Waldo Malqui Silva
        // *     example 1: long2ip( 3221234342 );
        // *     returns 1: '192.0.34.166'
        
        if (!isNaN(proper_address) && (proper_address >= 0 || proper_address <= 4294967295)) {
            return Math.floor(proper_address / Math.pow(256, 3)) + '.' +
                   Math.floor((proper_address % Math.pow(256, 3)) / Math.pow(256, 2)) + '.' +
                   Math.floor(((proper_address % Math.pow(256, 3)) % Math.pow(256, 2)) / Math.pow(256, 1)) + '.' +
                   Math.floor((((proper_address % Math.pow(256, 3)) % Math.pow(256, 2)) % Math.pow(256, 1)) /
                              Math.pow(256, 0));
        }
        
        return false;
    }
}