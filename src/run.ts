import chalk from 'chalk';

import { NEW_FILE_FILTER, MODIFIED_FILE_FILTER } from './constants';
import { getCliOptions } from './cliOptions';
import {
    filterFiles,
    getCoverageReport,
    getFilesWithNoTests,
    overrideGitPager,
    parseGitDiff,
    validateCoverageFile,
    validateCoverageMetrics,
    logger,
} from './utils';
import { CoverageFailureData } from './types';

/**
 * How does this work?
 *
 * This CLI tracks modified files or new files added between the current branch and a configured base branch,
 * and aims to organically grow test cases in large projects by mandating that files contain relevant test cases
 * and in the case of new files, the tests meet configured coverage criteria.
 *
 * For modified files, we check for the existence of tests. Any modified files that don't have any related tests
 * will be flagged.
 *
 * For new files, we check for existence of tests, as well as coverage. Any new files that don't have related tests, or
 * don't meet the coverage threshold defined by `branchCoverageThreshold`, `lineCoverageThreshold`, `statementCoverageThreshold`
 * or `functionCoverageThreshold` will be flagged.
 *
 * The cli exits with a failure if the flag count > 1
 */

function run(argv: Record<string, any>): void {
    const cliOptions = getCliOptions(argv);

    const noTestCasesPresent: string[] = [];
    const thresholdFailures: CoverageFailureData[] = [];

    overrideGitPager();

    const modifiedFiles = parseGitDiff(
        'modified',
        MODIFIED_FILE_FILTER,
        cliOptions.baseBranch as string,
        cliOptions.verbose as boolean,
    );
    const newFiles = parseGitDiff(
        'new',
        NEW_FILE_FILTER,
        cliOptions.baseBranch as string,
        cliOptions.verbose as boolean,
    );

    /**
     * Finds all modified and new files that match the provided glob patterns.
     */
    const filteredModifiedFiles = filterFiles(modifiedFiles, (cliOptions.trackGlobs as string).split(','));
    const filteredNewFiles = filterFiles(newFiles, (cliOptions.trackGlobs as string).split(','));

    if (!filteredModifiedFiles.length && !filteredNewFiles.length) {
        console.log(chalk.grey('No files match provided --trackGlobs. Skipping...'));
        process.exit(0);
    }

    noTestCasesPresent.push(...getFilesWithNoTests('modified', filteredModifiedFiles, cliOptions.verbose as boolean));
    noTestCasesPresent.push(...getFilesWithNoTests('new', filteredNewFiles, cliOptions.verbose as boolean));

    if (!cliOptions.skipCoverage) {
        validateCoverageFile(cliOptions.coverageFile as string);
        const coverageReport = getCoverageReport(cliOptions.coverageFile as string);

        logger(
            `Branch Coverage Threshold: ${chalk.blue(cliOptions.branchCoverageThreshold)}`,
            cliOptions.verbose as boolean,
        );
        logger(
            `Line Coverage Threshold: ${chalk.blue(cliOptions.lineCoverageThreshold)}`,
            cliOptions.verbose as boolean,
        );
        logger(
            `Statement Coverage Threshold: ${chalk.blue(cliOptions.statementCoverageThreshold)}`,
            cliOptions.verbose as boolean,
        );
        logger(
            `Function Coverage Threshold: ${chalk.blue(cliOptions.functionCoverageThreshold)}`,
            cliOptions.verbose as boolean,
        );

        /**
         * Validates coverage metrics for new files. Any file that does not meet the configured coverage threshold values
         * is flagged.
         */

        thresholdFailures.push(...validateCoverageMetrics(coverageReport, filteredNewFiles, cliOptions));
    } else {
        console.log(
            chalk.gray(
                `--skipCoverage set to ${chalk.blue(cliOptions.skipCoverage)}. Skipping coverage metrics validation...`,
            ),
        );
    }

    console.log('\n======== RESULT ========\n');

    if (noTestCasesPresent.length) {
        console.log(chalk.red('❌ No Test Cases found for the following files:\n'));
        noTestCasesPresent.forEach((file) => console.log(file));
        console.log('\n');
    }

    if (thresholdFailures.length) {
        console.log(chalk.red('❌ Coverage threshold not met for the following files:\n'));
        thresholdFailures.forEach((result) => {
            console.log(result.filename);
            console.log(
                `Branch Coverage: ${result.branches}% (${Math.floor(
                    result.branches - (cliOptions.branchCoverageThreshold as number),
                )}%)`,
            );
            console.log(
                `Line Coverage: ${result.lines}% (${Math.floor(
                    result.lines - (cliOptions.lineCoverageThreshold as number),
                )}%)`,
            );
            console.log(
                `Function Coverage: ${result.functions}% (${Math.floor(
                    result.functions - (cliOptions.functionCoverageThreshold as number),
                )}%)`,
            );
            console.log(
                `Statement Coverage: ${result.statements}% (${Math.floor(
                    result.statements - (cliOptions.statementCoverageThreshold as number),
                )}%)`,
            );
            console.log('\n');
        });
    }

    /**
     * CLI fails with a non-zero status (error status) if any file has been flagged.
     */
    if (noTestCasesPresent.length || thresholdFailures.length) {
        process.exit(-1);
    }

    console.log(chalk.green('✅ All good!'));
    process.exit(0);
}

export default run;
