import minimist from 'minimist';
import run from './run';
import help from './help';

function init() {
    const argv = minimist(process.argv.slice(2));

    if (argv.help) {
        help();
        process.exit(0);
    }

    run(argv);
}

init();
