/*
 * https://github.com/5orenso
 *
 * Copyright (c) 2020 Øistein Sørensen
 * Licensed under the MIT license.
 */

'use strict';

const tc = require('fast-type-check');

const Utilities = require('./util');
const UtilitiesHtml = require('./util-html');
const UtilitiesExpress = require('./util-express');

exports.tc = tc;

exports.utilities = Utilities;
exports.utilitiesHtml = UtilitiesHtml;
exports.utilitiesExpress = UtilitiesExpress;

exports.util = Utilities;
exports.utilHtml = UtilitiesHtml;
exports.utilExpress = UtilitiesExpress;
