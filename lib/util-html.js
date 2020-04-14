/*
 * https://github.com/5orenso
 *
 * Copyright (c) 2020 Øistein Sørensen
 * Licensed under the MIT license.
 */

'use strict';

const marked = require('marked');
const util = require('./util');

const renderer = new marked.Renderer();
const highlight = function highlight(code) {
    // eslint-disable-next-line
    return require('highlight.js').highlightAuto(code).value;
};

// Markdown setup.
marked.setOptions({
    renderer,
    highlight,
    pedantic: false,
    gfm: true,
    tables: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    xhtml: false,
});

renderer.heading = function heading(text, level) {
    const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
    return `<h${level} class="toc-${level}"><a name="${
        escapedText
    }" class="anchor" href="#${
        escapedText
    }"><span class="header-link"></span></a>${
        text}</h${level}>`;
};

renderer.image = function image($href, title, text) {
    if ($href.match(/youtube.com/)) {
        const regexp = /(^|[\s\t\n]+)https*:\/\/(www\.)*youtube\.com\/(.*?v=([^&\s]+)(&[^\s]+)*)/gi;
        const youtubeVideo = $href.replace(regexp, (match, p0, p1, p2, p3) => {
            return p3;
        });
        return `
            <div class="embed-responsive embed-responsive-16by9">
                <iframe class="embed-responsive-item" src="https://www.youtube.com/embed/${youtubeVideo}?rel=0" allowfullscreen></iframe>
            </div>
            <div class="image_inline_text"><strong>${text || ''}</strong> ${title || ''}</div>
        `;
    }
    const src = $href;
    const href = $href.replace(/(w=[0-9]+)/, 'w=1800');
    const mediaClass = [];
    const result = src.match(/#([a-z0-9,]+)$/);
    if (result) {
        const allClasses = result[1].split(',');
        if (allClasses[0] === 'card') {
            return `
                <div class="card float-right col-lg-4 col-md-6 col-sm-12 p-0 ml-2 mb-2 mt-2">
                    <img class="card-img-top" src="${src}" alt="${title || text}">
                    <div class="card-body">
                        <h5 class="card-title">${text || ''}</h5>
                        <p class="card-text">${title || ''}</p>
                    </div>
                </div>`;
        }
        if (allClasses[0] === 'card2') {
            return `
                <div class="float-right card col-lg-7 col-md-7 col-sm-12 p-0 ml-2 mb-2 mt-2">
                    <div class="row no-gutters">
                        <div class="col-md-4">
                            <img class="card-img img-fluid" src="${src}" alt="${title || text}">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${text || ''}</h5>
                                <p class="card-text">${title || ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        for (let i = 0, l = allClasses.length; i < l; i += 1) {
            mediaClass.push(allClasses[i]);
        }
    }
    return `
        <p class="image_inline ${mediaClass.join(' ')}">
            <a href="${href}" data-smoothzoom="group1" title="${title || text}">
                <img src="${src}" alt="${title || text}" title="${title || text}" class="img-fluid">
            </a>
            <div class="image_inline_text"><strong>${text || ''}</strong> ${title || ''}</div>
        </p>`;
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class HtmlUtilities {
    static fixImageLinksWhiteSpace(input) {
        function replacerImageWhiteSpace(match, p1, p2, p3) {
            const imageSrc = p2.replace(/ /g, '%20');
            const result = `![${p1}](${imageSrc}${p3})`;
            return result;
        }
        const reg = /!\[(.+?)\]\((.+?\.[a-z]{3,4})(.*?)\)/gi;
        return input.replace(reg, replacerImageWhiteSpace);
    }

    static replaceMarked(input) {
        if (typeof input === 'string') {
            const fixedInput = HtmlUtilities.fixImageLinksWhiteSpace(input);
            return marked(fixedInput);
        }
        return input;
    }

    static inlineImageSize($input, $size) {
        const input = $input.replace(/(<img.+?)\?w=[0-9]+/gi, `$1?w=${$size}`);
        return input;
    }

    static replaceDataTags($content, article) {
        if (typeof $content !== 'string') {
            return $content;
        }
        let content = $content;
        function replacerTags(match, $p1, $p2) {
            const p1 = $p1.replace(/\+/g, ' ');
            // console.log('replacerTags', match, p1, p2);
            if (p1.match(/^fa-/)) {
                let result = `<span class="fa ${p1}"></span>`;
                if (typeof p2 !== 'undefined') {
                    const count = parseInt(p2.trim(), 10);
                    if (typeof count === 'number') {
                        result = new Array(count + 1).join(result);
                    }
                }
                return result;
            }
            if (typeof $p2 !== 'undefined') {
                const p2 = $p2.replace(/\+/g, ' ');
                const command = p2.trim();
                let result = util.getString(article, p1.split('.')) || '';
                if (command === 'size') {
                    result = util.formatBytes(result, 2);
                } else if (command === 'date') {
                    result = util.isoDateNormalized(result);
                } else if (command === 'dim') {
                    result = util.formatDim(result);
                } else if (command === 'position') {
                    result = util.formatPosition(result);
                }

                return result;
            }
            return util.getString(article, p1.split('.')) || '';
        }

        const reg = /\[:([a-z_\-0-9.\+]+)(\s[a-z_\-0-9.\+]+)*?\]/gi;
        content = content.replace(reg, replacerTags);
        return content;
    }

    static replaceAt(string, index, replace) {
        return string.substring(0, index) + replace + string.substring(index + 1);
    }

    static dropFirstLetter($string) {
        let mode = 0;
        for (let i = 0, l = $string.length; i < l; i += 1) {
            const letter = $string.charAt(i);
            if (letter === '<') {
                mode = 1;
            } else if (letter === '>') {
                mode = 0;
            }
            if (mode === 0 && letter.match(/\w/)) {
                return HtmlUtilities.replaceAt($string, i, `<span class="blog-drop-letter">${letter}</span>`);
            }
        }
        return $string;
    }

    static dropFirstLetterAfterHr($string) {
        const stringParts = $string.split('<hr>');
        for (let i = 0, l = stringParts.length; i < l; i += 1) {
            stringParts[i] = HtmlUtilities.dropFirstLetter(stringParts[i]);
        }
        return stringParts.join('<hr>');
    }

    static runPlugins(content) {
        const fields = ['body', 'aside', 'ingress', 'teaser', 'footnote', 'col', 'youtube'];
        for (let i = 0, l = fields.length; i < l; i += 1) {
            const field = fields[i];
            if (content && typeof content[field] === 'string') {
                for (let j = 0, m = myPlugins.length; j < m; j += 1) {
                    if (typeof myPlugins[j] === 'object') {
                        const plugin = myPlugins[j];
                        // eslint-disable-next-line
                        content[field] = content[field].replace(plugin.get('regexp'), plugin.replacer);
                    }
                }
            }
        }
    }

    static cleanHtml($input) {
        const input = $input.replace(/<(h[1-9]).+?>.+?<\/\1>/gi, '');
        return input.replace(/<.+?>/g, ' ');
    }

    static mapNorwegianLetter(match, letter) {
        switch (letter) {
            case 'æ': return 'a';
            case 'ø': return 'o';
            case 'å': return 'a';
            default: return letter;
        }
    }

    static stripTags($input) {
        return String($input).replace(/<[^>]*>/g, '');
    }

    static asUrlSafe($input) {
        return encodeURIComponent(
            HtmlUtilities.stripTags($input),
        );
    }

    static asHtmlIdSafe($string) {
        if (typeof $string === 'string') {
            const string = $string.toLowerCase()
                .replace(/æ/i, 'e')
                .replace(/ø/i, 'o')
                .replace(/å/i, 'a')
                .replace(/[^a-z0-9]/gi, '-')
                .replace(/-+/g, '-')
                .replace(/^-/g, '')
                .replace(/-$/g, '');
            return string;
        }
        return $string;
    }

    static asLinkPart($input) {
        let input = String($input).toLowerCase();
        input = input.replace(/([æøå])/gi, HtmlUtilities.mapNorwegianLetter);
        input = input.replace(/[^a-z0-9_-]/g, '-');
        input = input.replace(/-+/g, '-');
        return input;
    }

    static substring(input, start, end) {
        return input.substring(start, end);
    }

    static fixFilename(filename) {
        return filename.replace(/^_/, '');
    }

    static removeLineBreaks(content) {
        if (typeof content === 'string') {
            return content.replace(/(\n|\r)+/g, ' ');
        }
        return content;
    }

    static match($string, $match) {
        const regexp = new RegExp($match);
        return $string.match(regexp);
    }
}

module.exports = HtmlUtilities;
