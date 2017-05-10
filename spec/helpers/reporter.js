const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const env = jasmine.getEnv();
env.clearReporters();
env.addReporter(new SpecReporter());