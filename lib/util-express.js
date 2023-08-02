/*
 * https://github.com/5orenso
 *
 * Copyright (c) 2017 Øistein Sørensen
 * Licensed under the MIT license.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Lynx = require('lynx');
const tc = require('fast-type-check');

const swig = require('./swig');
const util = require('./util');

const appPath = path.normalize(`${__dirname}/../`);
const lynxMetrics = new Lynx('localhost', 8125);
const baseTemplatePath = `${appPath}template`;
const templatePath = `${appPath}template/current`;

const CONSOLE_COLORS = {
    Reset: '\x1b[0m',
    Bright: '\x1b[1m',
    Dim: '\x1b[2m',
    Underscore: '\x1b[4m',
    Blink: '\x1b[5m',
    Reverse: '\x1b[7m',
    Hidden: '\x1b[8m',

    FgBlack: '\x1b[30m',
    FgRed: '\x1b[31m',
    FgGreen: '\x1b[32m',
    FgYellow: '\x1b[33m',
    FgBlue: '\x1b[34m',
    FgMagenta: '\x1b[35m',
    FgCyan: '\x1b[36m',
    FgWhite: '\x1b[37m',

    BgBlack: '\x1b[40m',
    BgRed: '\x1b[41m',
    BgGreen: '\x1b[42m',
    BgYellow: '\x1b[43m',
    BgBlue: '\x1b[44m',
    BgMagenta: '\x1b[45m',
    BgCyan: '\x1b[46m',
    BgWhite: '\x1b[47m',
};

class WebUtilities {
    static isDevelopment() {
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        return false;
    }

    static print(...args) {
        const len = args.length;
        for (let i = 0; i < len; i += 1) {
            if (typeof args[i] === 'object') {
                console.log(JSON.stringify(args[i]));
            } else {
                console.log(args[i]);
            }
        }
    }

    static printIfDev(...args) {
        if (WebUtilities.isDevelopment()) {
            WebUtilities.print(args);
        }
    }

    static restrict(req, res, next) {
        if (req.session && (req.session.email || req.session.cellphone)) {
            next();
        } else {
            if (typeof req.originalUrl === 'string' && !req.originalUrl.match(/(login|logout)/)) {
                req.session.originalUrl = req.originalUrl;
            }
            res.redirect('/login');
        }
    }

    static renderApi(req, res, opt = {}) {
        const { hrstart, runId } = tc.getNestedValue(req, '__runTimeData') || {};
        const { routeName, routePath, appPath: applicationPath } = tc.getNestedValue(req, '__initOpt') || {};

        if (typeof res.set === 'function') {
            if (opt.cacheTime) {
                res.set('Cache-Control', `public, max-age=${opt.cacheTime}`);
                res.set('Expires', new Date(Date.now() + opt.cacheTime * 1000).toUTCString());
            } else if (opt.cacheControl) {
                res.set('Cache-Control', opt.cacheControl);
            } else {
                res.set('Cache-Control', 'no-cache');
            }
        }

        const response = { ...opt.response };
        if (!WebUtilities.isDevelopment()) {
            delete response.docs;
        }
        if (opt.rawOutput) {
            res.status(response.status || 200).json({
                ...response,
            });
        } else {
            res.status(response.status || 200).json({
                stats: { runTime: util.runTime(hrstart) },
                ...response,
            });
        }
        WebUtilities.logFunctionTimer({
            ...opt,
            hrstart,
            runId,
            routeName,
            routePath,
            appPath: applicationPath,
            action: 'end',
        }, req);
        // res.end();
    }

    static restrictAPI(req, res, next) {
        let isAllowedAccess = false;
        if (typeof req.user === 'object') {
            if (req.user.email) {
                isAllowedAccess = true;
            } else if (req.user.cellphone) {
                isAllowedAccess = true;
            }
            if (isAllowedAccess) {
                return next();
            }
        }
        const response = {
            status: 403,
            message: 'Forbidden! No access to this endpoint with this jwtToken.',
        };
        return WebUtilities.renderApi(req, res, { response });
    }

    static getConsoleColors() {
        return CONSOLE_COLORS;
    }

    static lynxSafe(input) {
        return String(input).replace(/\//g, '-');
    }

    static logFunctionTimer(opt, req = opt.req) {
        if (typeof opt.routePath !== 'string' || typeof opt.routeName !== 'string'
            || (typeof opt.hrend !== 'object' && typeof opt.hrstart !== 'object')) {
            return false;
        }
        let libName;
        if (opt.libName) {
            const regExp = new RegExp(appPath);
            libName = opt.libName.replace(regExp, '');
        }
        let reqOpt = {};
        if (typeof req !== 'undefined') {
            reqOpt = {
                originalUrl: req.originalUrl,
                reqQuery: req.query,
                reqParams: req.params,
                reqBody: req.body,
            };
        }
        const hrend = opt.hrend || process.hrtime(opt.hrstart);

        const runTime = ((hrend[0] * 1e9) + hrend[1]) / 1000000;
        // Send timing data via UDP to localhost port 8125
        let lynxKey = `${WebUtilities.lynxSafe(opt.routePath)}.${WebUtilities.lynxSafe(opt.routeName)}.`
            + `${WebUtilities.lynxSafe(libName)}.${WebUtilities.lynxSafe(opt.funcName)}.`
            + `${WebUtilities.lynxSafe(opt.funcPart)}`;
        lynxKey = lynxKey.replace(/\.+$/, '');
        lynxMetrics.timing(lynxKey, runTime); // time in ms

        if (WebUtilities.isDevelopment()) {
            const cc = CONSOLE_COLORS;
            const output = JSON.stringify(tc.cleanObject({
                runId: opt.runId,
                routePath: opt.routePath,
                routeName: opt.routeName,
                originalUrl: opt.originalUrl || reqOpt.originalUrl,
                reqQuery: opt.reqQuery || reqOpt.reqQuery,
                reqParams: opt.reqParams || reqOpt.reqParams,
                reqBody: opt.reqBody || reqOpt.reqBody,
                libName,
                funcName: opt.funcName,
                funcPart: opt.funcPart,
                action: opt.action,
                runTime,
            }));
            if (runTime > 5000) {
                console.log(`${cc.Bright}${cc.FgWhite}${cc.BgRed}%s${cc.Reset}`, output);
            } else if (runTime > 3000) {
                console.log(`${cc.Underscore}${cc.Bright}${cc.FgRed}%s${cc.Reset}`, output);
            } else if (runTime > 1500) {
                console.log(`${cc.Bright}${cc.FgRed}%s${cc.Reset}`, output);
            } else if (runTime > 1000) {
                console.log(`${cc.FgRed}%s${cc.Reset}`, output);
            } else if (runTime > 500) {
                console.log(`${cc.Bright}${cc.FgYellow}%s${cc.Reset}`, output);
            } else if (runTime > 300) {
                console.log(`${cc.FgYellow}%s${cc.Reset}`, output);
            } else if (runTime > 50) {
                console.log(`${cc.FgGreen}%s${cc.Reset}`, output);
            } else if (runTime > 5) {
                console.log(`${cc.Bright}${cc.FgGreen}%s${cc.Reset}`, output);
            } else {
                console.log(output);
            }
        }
        return true;
    }

    static getCommonTemplateValues(req) {
        let jwtToken;
        if (req.hasOwnProperty('config') && req.config.hasOwnProperty('jwt')) {
            jwtToken = util.makeJwtToken({ email: req.session.email }, req.config);
        }
        return {
            jwtToken,
            session: req.session,
            cookies: req.cookies,
            signedCookies: req.signedCookies,
            originalUrl: req.originalUrl,
            originalUrlPath: req.originalUrl.replace(/\/[^/]+$/, '/'),
            queryString: req.query,
            params: req.params,
            requestHeaders: req.headers,
            currentEmail: req.session.email,
            realEmail: req.session.email,
            blog: req.config.blog,
            env: {
                isDevelopment: WebUtilities.isDevelopment(),
                now: util.formatDate(),
                epoch: util.epoch(),
            },
        };
    }

    static resolveTemplate(req, useTemplate, useTemplatePath = true) {
        // console.log('resolveTemplate', useTemplate, useTemplatePath);
        let requestPathname = '/index';
        if (typeof useTemplate === 'string') {
            requestPathname = useTemplate;
        } else if (typeof req === 'object' && req.hasOwnProperty('_parsedUrl')) {
            // eslint-disable-next-line
            requestPathname = req._parsedUrl.pathname;
        }
        if (typeof requestPathname === 'string' && !requestPathname.match(/\.html$/)) {
            requestPathname += '.html';
        }
        if (typeof useTemplatePath === 'boolean' && useTemplatePath) {
            return baseTemplatePath + requestPathname;
        }
        return templatePath + requestPathname;
    }

    static sendResultResponse(req, res, $dataObject, $useTemplate, $useTemplatePath) {
        try { // Trying to load template.
            let useTemplate;
            let useTemplatePath;
            let opt = {
                libName: __filename,
                funcName: 'sendResultResponse',
                originalUrl: req.originalUrl,
                reqQuery: req.query,
                reqParams: req.params,
            };
            if (typeof $useTemplate === 'object') {
                opt = Object.assign(opt, $useTemplate);
                if (typeof opt.hrstart === 'object') {
                    WebUtilities.logFunctionTimer(Object.assign(opt, { funcPart: 'start', hrstart: opt.hrstart }));
                }
                useTemplate = opt.useTemplate;
                useTemplatePath = opt.useTemplatePath;
            } else {
                useTemplate = $useTemplate;
                useTemplatePath = $useTemplatePath;
            }

            const dataObject = $dataObject;
            let hrstart = process.hrtime();
            const tpl = swig.compileFile(WebUtilities.resolveTemplate(req, useTemplate, useTemplatePath));
            WebUtilities.logFunctionTimer(Object.assign(opt, { funcPart: 'swig.compileFile', hrstart }));

            // Assign data to final object.
            hrstart = process.hrtime();
            const completeSwigObject = Object.assign(dataObject, WebUtilities.getCommonTemplateValues(req));
            WebUtilities.logFunctionTimer(Object.assign(opt, { funcPart: 'assignedData', hrstart }));

            hrstart = process.hrtime();
            res.set('Cache-Control', 'public, max-age=0');
            res.status(200).send(tpl(completeSwigObject));
            WebUtilities.logFunctionTimer(Object.assign(opt, { funcPart: 'compiledAndSend', hrstart }));
        } catch (err) { // Fail if template don't exists
            res.status(404).send(`Page not found: ${err}`);
        }
        return true;
    }

    static renderPage(req, res, content, template) {
        // eslint-disable-next-line
        let requestPathname = template || req._parsedUrl.pathname;
        try {
            const tpl = swig.compileFile(templatePath + requestPathname);
            res.send(tpl(Object.assign({
                cookies: req.cookies,
                signedCookies: req.signedCookies,
                queryString: req.query,
                requestHeaders: req.headers,
                now: new Date().getTime(),
            }, content)));
        } catch (err) {
            res.status(404).send(`Page not found: ${err}`);
        }
    }

    static renderError(req, res, err) {
        const errorMessage = `<center><h1>Something awful happend...</h1>
            A special force is looking into this right now!<br>
            <br>
            Please try again later...<br>
            <xmp>
               method: ${req.method}
               url: ${req.url}
               headers: ${req.headers}
            </xmp>

            Server Error (This should not be displayed to the users):
            <xmp>
               ${err}
            </xmp>
        </center>`;
        res.status(500).send(errorMessage);
    }

    static loadFile(filename) {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, { encoding: 'utf8' }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    static hasAllRequiredFields(req, res, dataField = 'body', requiredFields = []) {
        // Check for all required fields.
        const errors = [];
        const missingFields = [];
        for (let i = 0, l = requiredFields.length; i < l; i += 1) {
            const field = requiredFields[i];
            if (typeof req[dataField] !== 'object' || typeof req[dataField][field] === 'undefined') {
                missingFields.push(field);
                errors.push(`Missing field "${field}"`);
            }
        }
        if (errors.length > 0) {
            WebUtilities.renderApi(req, res, {
                response: {
                    status: 422,
                    message: `ERROR! Missing fields: ${missingFields.join(', ')}`,
                    data: ['Missing fields'].concat(errors),
                },
            });
            return false;
        }
        return true;
    }
}

module.exports = WebUtilities;
