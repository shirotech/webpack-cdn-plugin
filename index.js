const semver = require('semver');

module.exports = require(semver.gt('6.0.0', process.version) ? './dist' : './src');