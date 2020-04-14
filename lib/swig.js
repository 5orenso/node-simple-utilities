/*
 * https://github.com/5orenso
 *
 * Copyright (c) 2020 Øistein Sørensen
 * Licensed under the MIT license.
 */

'use strict';

// const util = require('./utilities');
const swig = require('swig');
const util = require('./util');
const utilHtml = require('./util-html');

swig.setFilter('markdown', utilHtml.replaceMarked);
swig.setFilter('substring', utilHtml.substring);
swig.setFilter('cleanHtml', utilHtml.cleanHtml);
swig.setFilter('fixFilename', utilHtml.fixFilename);
swig.setFilter('removeLineBreaks', utilHtml.removeLineBreaks);
swig.setFilter('match', utilHtml.match);
swig.setFilter('inlineImageSize', utilHtml.inlineImageSize);
swig.setFilter('oneline', util.oneline);
swig.setFilter('format', util.format);

// V2 formatting:
swig.setFilter('md', utilHtml.replaceMarked);
swig.setFilter('imgSize', utilHtml.inlineImageSize);
swig.setFilter('dataTags', utilHtml.replaceDataTags);
swig.setFilter('dropFirstLetter', utilHtml.dropFirstLetter);
swig.setFilter('dropFirstLetterAfterHr', utilHtml.dropFirstLetterAfterHr);

swig.setFilter('asUrlSafe', utilHtml.asUrlSafe);
swig.setFilter('asLinkPart', utilHtml.asLinkPart);
swig.setFilter('stripTags', utilHtml.stripTags);
swig.setFilter('uc', util.uc);
swig.setFilter('indexOf', util.indexOf);
swig.setFilter('length', util.length);
swig.setFilter('diagnosticDoc', util.diagnosticDoc);

// const nobreaks = require('./swig-extensions/nobreaks-tag.js');
//
// swig.setTag('nobreaks', nobreaks.parse, nobreaks.compile, nobreaks.ends, nobreaks.blockLevel);

module.exports = swig;
