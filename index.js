const semver = require('semver');

module.exports = require(semver.gt(process.version, '6.0.0') ? './src' : './dist');