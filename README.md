# A Node.js collection model for mongoose stuff

[![Build Status](https://travis-ci.org/5orenso/node-simple-utilities.svg?branch=master)](https://travis-ci.org/5orenso/node-simple-utilities)
[![Coverage Status](https://coveralls.io/repos/github/5orenso/node-simple-utilities/badge.svg?branch=master)](https://coveralls.io/github/5orenso/node-simple-utilities?branch=master)
[![GitHub version](https://badge.fury.io/gh/5orenso%2Fnode-simple-utilities.svg)](https://badge.fury.io/gh/5orenso%2Fnode-simple-utilities)
[![npm version](https://badge.fury.io/js/node-simple-utilities.svg)](https://badge.fury.io/js/node-simple-utilities)

## TL;DR

### Installation

```bash
npm install node-simple-utilities --save
```

### Usage

It's easy. Import and use the utilities.

```javascript
const { util } = require('node-simple-utilities');

const formatted = util.format(12345.6789, 2);
// 12 345,68
```

```javascript
const { util } = require('node-simple-utilities');

const config = {
    jwt: {
        secret: 'I am a very secret secret!',
    }
};
const jwtToken = util.makeJwtToken({ email: 'sorenso@gmail.com' }, config);
```

### List of some useful functions

#### util

- format
- formatDate
- epoch
- cleanObject
- indexOf
- length
- makeJwtToken
- decodeJwtToken
- getApiObject
- getApiObjects
- mongoSanitize
- makeSearchObject
- oneline
- uc

#### utilHtml

- fixImageLinksWhiteSpace
- replaceMarked
- inlineImageSize
- replaceDataTags
- replaceAt
- dropFirstLetter
- dropFirstLetterAfterHr
- runPlugins
- cleanHtml
- mapNorwegianLetter
- stripTags
- asUrlSafe
- asHtmlIdSafe
- asLinkPart
- substring
- fixFilename
- removeLineBreaks
- match

#### utilExpress

- isDevelopment
- print
- printIfDev
- restrict
- renderApi
- restrictAPI
- getConsoleColors
- lynxSafe
- logFunctionTimer
- getCommonTemplateValues
- resolveTemplate
- sendResultResponse
- renderPage
- renderError
- loadFile

I promise to add some more documentation, or if you want to help, please follow the instructions below.

## Helper modules in use:

__Jest__ A browser JavaScript testing toolkit. Jest is used by Facebook to test all JavaScript code including React applications. One of Jest's philosophies is to provide an integrated "zero-configuration" experience.

__ESLint__ ESLint is a code style linter for programmatically enforcing your style guide.

__Travis__
Travis CI is a hosted continuous integration service. It is integrated with GitHub and offers first class support for many languages.

__Coveralls.io__
Coveralls is a web service to help you track your code coverage over time, and ensure that all your new code is fully covered.

__Retire__
Scanner detecting the use of JavaScript libraries with known vulnerabilities.


### Howto to get started with contributions

```bash
$ git clone git@github.com:5orenso/node-simple-utilities.git
$ cd node-simple-utilities/
$ npm install
```

Start developing. Remember to start watching your files:
```bash
$ npm run test:watch
```


### HOWTO fix eslint issues
```bash
$ eslint --fix lib/utilities.js
```


### Howto contribute

```bash
$ git clone git@github.com:5orenso/node-simple-utilities.git
```
Do your magic and create a pull request.


### Howto report issues
Use the [Issue tracker](https://github.com/5orenso/node-simple-utilities/issues)


### Howto update CHANGELOG.md
```bash
$ bash ./changelog.sh
```


### Howto update NPM module

1. Bump version inside `package.json`
2. Push all changes to Github.
3. Push all changes to npmjs.com: `$ bash ./npm-release.sh`.


### Howto check for vulnerabilities in modules
```bash
# Install Node Security Platform CLI
$ npm install nsp --global  

# From inside your project directory
$ nsp check  
```


### Howto upgrade modules
```bash
$ sudo npm install -g npm-check-updates
$ ncu -u -a
$ npm install --no-optional
```


### Versioning
For transparency and insight into the release cycle, releases will be
numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on semantic versioning, please visit http://semver.org/.


## Contributions and feedback:

We ❤️ contributions and feedback.

If you want to contribute, please check out the [CONTRIBUTING.md](CONTRIBUTING.md) file.

If you have any question or suggestion create an issue.

Bug reports should always be done with a new issue.


## Other Resources

* [Node.js utilities](https://github.com/5orenso/node-simple-utilities)
* [Node.js Preact utilities](https://github.com/5orenso/node-simple-utilities)
* [Node.js Preact Mobx storemodel](https://github.com/5orenso/node-simple-utilities)
* [Node.js boilerplate for Express](https://github.com/5orenso/node-express-boilerplate)
* [Node.js boilerplate for modules](https://github.com/5orenso/node-simple-boilerplate)
* [Node.js boilerplate for Preact](https://github.com/5orenso/preact-boilerplate)


## More about the author

- Twitter: [@sorenso](https://twitter.com/sorenso)
- Instagram: [@sorenso](https://instagram.com/sorenso)
- Facebook: [@sorenso](https://facebook.com/sorenso)
