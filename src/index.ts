import minimist from 'minimist';
import run from './run';

function init() {
    const argv = minimist(process.argv.slice(2));

    if (argv.help) {
        // showHelp();
        process.exit(0);
    }

    run(argv);
}

init();
