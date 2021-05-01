import minimist from 'minimist';
import run from './run';
import help from './help';
import { logger } from './utils';
import { getCliOptions, CLI_OPTIONS } from './cliOptions';

function init() {
    const argv = minimist(process.argv.slice(2));

    if (argv.help) {
        help();
        process.exit(0);
    }

    const cliOptions = getCliOptions(argv);

    CLI_OPTIONS.forEach((option) => {
        logger(`--${option.valueKey}: ${cliOptions[option.valueKey]}`, cliOptions.verbose as boolean);
    });

    run(cliOptions);
}

init();
