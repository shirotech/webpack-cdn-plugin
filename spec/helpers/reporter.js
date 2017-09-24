import { SpecReporter } from 'jasmine-spec-reporter';

const env = jasmine.getEnv();
env.clearReporters();
env.addReporter(new SpecReporter());
