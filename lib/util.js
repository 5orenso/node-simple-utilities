/*
 * https://github.com/5orenso
 *
 * Copyright (c) 2020 Øistein Sørensen
 * Licensed under the MIT license.
 */

'use strict';

const strftime = require('strftime');
const tc = require('fast-type-check');
const jwt = require('jsonwebtoken');

class Utilities {
    static runTime(hrstart) {
        if (!hrstart) {
            return process.hrtime();
        }
        const hrend = process.hrtime(hrstart);
        const runTime = ((hrend[0] * 1e9) + hrend[1]) / 1000000;
        return runTime;
    }

    static format($number, $decimals, $decPoint, $thousandsSep) {
        const decimals = Number.isNaN($decimals) ? 2 : Math.abs($decimals);
        const decPoint = ($decPoint === undefined) ? ',' : $decPoint;
        const thousandsSep = ($thousandsSep === undefined) ? ' ' : $thousandsSep;

        const number = Math.abs($number || 0);
        const sign = $number < 0 ? '-' : '';

        if (tc.isNumber(number)) {
            const intPart = String(parseInt(number.toFixed(decimals), 10));
            const j = intPart.length > 3 ? intPart.length % 3 : 0;

            const firstPart = (j ? intPart.substr(0, j) + thousandsSep : '');
            const secondPart = intPart.substr(j).replace(/(\d{3})(?=\d)/g, `$1${thousandsSep}`);
            const decimalPart = (decimals ? decPoint + Math.abs(number - intPart).toFixed(decimals).slice(2) : '');
            return `${sign}${firstPart}${secondPart}${decimalPart}`;
        }
        return '';
    }

    static formatDate($isoDate) {
        const isoDate = $isoDate || strftime('%Y-%m-%d');
        let format = '%b %e';
        const currentYear = strftime('%Y');
        const thisYear = strftime('%Y', new Date(Date.parse(isoDate)));
        if (currentYear > thisYear) {
            format = '%b %e, %Y';
        }
        return strftime(format, new Date(Date.parse(isoDate)));
    }

    static epoch($date) {
        if (typeof $date !== 'undefined') {
            return new Date($date).getTime();
        }
        return new Date().getTime();
    }

    static cleanObject($obj, opt = {}) {
        const obj = Object.assign({}, $obj);
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i += 1) {
            const idx = keys[i];
            if (obj.hasOwnProperty(idx)) {
                if (typeof obj[idx] === 'undefined' || obj[idx] === false) {
                    delete obj[idx];
                }
                if (opt.emptyIsUndefined && obj[idx] === '') {
                    delete obj[idx];
                }
                if (opt.zeroIsUndefined && obj[idx] === 0) {
                    delete obj[idx];
                }
                if (opt.zeroStringIsUndefined && obj[idx] === '0') {
                    delete obj[idx];
                }
                if (opt.nullIsUndefined && obj[idx] === null) {
                    delete obj[idx];
                }
            }
        }
        return obj;
    }

    static indexOf(array, element) {
        if (array.indexOf(element) === -1) {
            return false;
        }
        return true;
    }

    static length(array) {
        if (Array.isArray(array)) {
            return array.length;
        }
        return String(array).length;
    }

    static diagnosticDoc(scan, diagnostic, doc, opt = {}) {
        let count = 0;
        const aiReRunKey = opt.aiReRunKey || 'aiResultsRerun';
        for (let i = 0, l = scan.aiResults.length; i < l; i += 1) {
            if (scan[aiReRunKey] && scan[aiReRunKey][i]) {
                const tile = scan[aiReRunKey][i];
                // Adding docDiagnostic from main aiResults.
                tile.docDiagnostic = scan.aiResults[i].docDiagnostic;

                tile.diagnostic = {
                    score: 0,
                };
                if (tc.isObject(tile.aiPrediction)) {
                    const aiKeys = Object.keys(tile.aiPrediction);
                    for (let j = 0, m = aiKeys.length; j < m; j += 1) {
                        const key = aiKeys[j];
                        const keyTrimmed = aiKeys[j].trim();
                        const score = tile.aiPrediction[key];
                        tile.aiPrediction[keyTrimmed] = tile.aiPrediction[key];
                        if (tile.diagnostic.score < score) {
                            tile.diagnostic.type = keyTrimmed;
                            tile.diagnostic.score = score;
                        }
                    }
                    if (doc) {
                        if (diagnostic === tile.docDiagnostic) {
                            count += 1;
                        }
                    } else if (diagnostic === tile.diagnostic.type) {
                        count += 1;
                    }
                }
            }
        }

        // "originalResolution": [
        //         "89262",
        //         "206770"
        //     ],
        //     "id": 3,
        //     "__v": 0,
        //     "aiResults": [
        //         {
        //             "tileName": "tile-28947,144997-3101x3101-.jpg",
        //             "coords": [
        //                 "28947",
        //                 "144997"
        //             ],
        //             "size": [
        //                 "3101",
        //                 "3101"
        //             ],
        //             "aiPrediction": {
        //                 " tp c c1 ": 0.88865,
        //                 " tp c c2 ": 0.06175,
        //                 " tp c c3 ": 0.04614,
        //                 " tp c p ": 0.00346
        //             },
        //             "docDiagnostic": "tp c burncut"
        //         },
        if (opt.debug) {
            count = `${diagnostic}, ${count}: ${JSON.stringify(scan[aiReRunKey], null, 4)}`;
        }
        return count;
    }

    static makeJwtToken(object, config, expiresIn) {
        const $tokenInfo = Utilities.cleanObject(object);
        const opt = Utilities.cleanObject({
            expiresIn,
        });
        const generateJwt = tokenInfo => jwt.sign(tokenInfo, config.jwt.secret, opt);
        const token = generateJwt($tokenInfo);
        return token;
    }

    static decodeJwtToken(token, config) {
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, config.jwt.secret);
        } catch (error) {
            decodedToken = { error: 'JsonWebTokenError: jwt malformed' };
        }
        return decodedToken;
    }

    static getApiObject(obj = {}, fields, types = {}) {
        const ret = {};
        if (fields.length > 1000) {
            throw new Error(`Are you nuts? Over 1000 fields. Really? ${fields.length} fields.`);
        }
        for (let i = 0; i < fields.length; i += 1) {
            const field = fields[i];
            let outFieldName = field;
            let objFieldName = field;
            if (typeof field === 'object') {
                outFieldName = field.rewriteTo;
                objFieldName = field.fieldName;
            }
            if (typeof obj[objFieldName] !== 'undefined') {
                if (Array.isArray(types.int) && types.int.indexOf(objFieldName) !== -1) {
                    ret[outFieldName] = parseInt(obj[objFieldName], 10);
                } else if (Array.isArray(types.float) && types.float.indexOf(objFieldName) !== -1) {
                    ret[outFieldName] = Utilities.format(parseFloat(obj[objFieldName]), 2, ',', '');
                } else {
                    ret[outFieldName] = obj[objFieldName];
                }
            } else {
                ret[objFieldName] = undefined;
            }
        }
        return ret;
    }

    static getApiObjects(list, fields, types) {
        const ret = [];
        for (let i = 0; i < list.length; i += 1) {
            const item = list[i];
            ret.push(Utilities.getApiObject(item, fields, types));
        }
        return ret;
    }

    static mongoSanitize($input) {
        const input = $input;
        if (input instanceof Object) {
            const keys = Object.keys(input);
            for (let i = 0; i < keys.length; i += 1) {
                const key = keys[i];
                if (/^\$/.test(key)) {
                    delete input[key];
                }
            }
        }
        return input;
    }

    static makeSearchObject(searchQuery, searchFields, intSearchFields, useTextIndexCombined = false) {
        if (typeof searchQuery === 'undefined') {
            return {};
        }
        // db.product.find( { $text: { $search: "g4z" } } );

        const searchWords = searchQuery.split(' ')
            .filter(word => (word.trim() !== ''));
        const searchObject = {};
        // if (useTextIndexCombined) {
        //     searchObject.$and = [
        //         { $text: { $search: searchQuery } },
        //     ];
        // }
        for (let h = 0; h < searchWords.length; h += 1) {
            const word = searchWords[h];
            const searchObj = {};
            for (let i = 0; i < searchFields.length; i += 1) {
                if (searchFields.hasOwnProperty(i)) {
                    const searchField = searchFields[i];
                    const searchElement = {};
                    searchElement[searchField] = { $regex: `${Utilities.mongoSanitize(word)}`, $options: 'i' };
                    if (typeof searchObj.$or === 'undefined') {
                        searchObj.$or = [];
                    }
                    searchObj.$or.push(searchElement);
                }
            }
            if (typeof intSearchFields !== 'undefined') {
                const intNumber = parseInt(word, 10);
                if (typeof intNumber === 'number' && !isNaN(intNumber)) {
                    for (let i = 0; i < intSearchFields.length; i += 1) {
                        if (intSearchFields.hasOwnProperty(i)) {
                            const searchField = intSearchFields[i];
                            const searchElement = {};
                            searchElement[searchField] = { $eq: intNumber };
                            if (typeof searchObj.$or === 'undefined') {
                                searchObj.$or = [];
                            }
                            searchObj.$or.push(searchElement);
                        }
                    }
                }
            }
            if (typeof searchObject.$and === 'undefined') {
                searchObject.$and = [];
            }
            searchObject.$and.push(searchObj);
        }
        // console.log(JSON.stringify(searchObject, null, 4));
        return searchObject;
    }

    static oneline(name) {
        let str = name;
        if (typeof str === 'string') {
            str = str.replace(/\r+/g, ' ');
            str = str.replace(/\n+/g, ' ');
            str = str.replace(/\t+/g, ' ');
            str = str.replace(/\s+/g, ' ');
            str = str.replace(/^\s+/, '');
            str = str.replace(/\s+$/, '');
        }
        return str;
    }

    static uc($input) {
        return String($input).toUpperCase();
    }

    static concat(...arrays) {
        return [].concat(...arrays.filter(Array.isArray));
    }

    static generateCode(min = 100000, max = 999999) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static validateCode({ code, min = 100000, max = 999999, returnCode = false }) {
        let parsedCode = `${code}`.replace(/[^0-9]/g, '');
        parsedCode = parseInt(parsedCode, 10);
        if (parsedCode >= min && parsedCode <= max) {
            if (returnCode) {
                return parsedCode;
            }
            return true;
        }
        return false;
    }

    static formatCode(num, sep = ' ') {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${sep}`);
    }

    static validateEmail(email) {
        // eslint-disable-next-line
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    static rgb2hsv(cr, cg, cb) {
        // R, G, B values are divided by 255
        // to change the range from 0..255 to 0..1
        const r = cr / 255.0;
        const g = cg / 255.0;
        const b = cb / 255.0;

        // h, s, v = hue, saturation, value
        const cmax = Math.max(r, Math.max(g, b)); // maximum of r, g, b
        const cmin = Math.min(r, Math.min(g, b)); // minimum of r, g, b
        const diff = cmax - cmin; // diff of cmax and cmin.
        let h = -1;
        let s = -1;

        // if cmax and cmax are equal then h = 0
        if (cmax === cmin) {
            h = 0;
        } else if (cmax === r) {
            // if cmax equal r then compute h
            h = ((60 * ((g - b) / diff)) + 360) % 360;
        } else if (cmax === g) {
            // if cmax equal g then compute h
            h = ((60 * ((b - r) / diff)) + 120) % 360;
        } else if (cmax === b) {
            // if cmax equal b then compute h
            h = ((60 * ((r - g) / diff)) + 240) % 360;
        }

        // if cmax equal zero
        if (cmax === 0) {
            s = 0;
        } else {
            s = (diff / cmax) * 100;
        }

        // compute v
        const v = cmax * 100;
        return { h, s, v };
    }

    static replaceAll(data, string) {
        let result = string;
        const keys = Object.keys(data);
        for (let i = 0, l = keys.length; i < l; i += 1) {
            const key = keys[i];
            const regExp = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regExp, data[key]);
        }
        return result;
    }

    static range(start, end, step = 1) {
        const result = [];
        let current = start;
        while (current <= end) {
            result.push(current);
            current += step;
        }
        return result;
    }
}

module.exports = Utilities;
