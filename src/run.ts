import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import micromatch from 'micromatch';

import { NEW_FILE_FILTER, MODIFIED_FILE_FILTER } from './constants';
import { getCliOptions } from './cliOptions';

/**
 * Function that takes in the console output of `git diff --name-status` and returns
 * only the filenames
 *
 * Input:
 * M     <filename1>
 * M     <filename2>
 *
 * Output:
 * [filename1, filename2]
 *
 */
function extractFileNames(results: string, diffFilter: typeof NEW_FILE_FILTER | typeof MODIFIED_FILE_FILTER) {
    return results
        .split('\n')
        .map((gitString) => gitString.split(`${diffFilter}\t`)[1])
        .filter((fileName) => fileName);
}

/**
 * Filters file(s) that match the provided glob pattern(s)
 *
 * https://github.com/micromatch/micromatch
 */
function filterFiles(files: string[], globList: string[]) {
    return micromatch(files, globList);
}

/**
 * Runs an inbuilt jest command to find all related tests for a given source file. A test is marked as "related" if:
 *
 * 1. The source file is included in a test script
 * 2. The source file is included in another file that is included in a test script
 *
 * --findRelatedTests: Runs test cases that jest figures out are related to your source file
 * --listTests: Prevents running of the tests and only shows which tests have identified
 */
function checkTestExistence(file: string) {
    return execSync(`./node_modules/.bin/jest --findRelatedTests --listTests ${file}`, {
        encoding: 'utf8',
    })
        .split('\n')
        .filter(Boolean).length;
}

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
 * The utility exits with a failure if the flag count > 1
 */

function run(argv: Record<string, any>) {
    const cliOptions = getCliOptions(argv);

    /**
     * Arrays housing flagged files.
     */
    const noTestCasesPresent: string[] = [];
    const thresholdFailures: Array<{
        filename: string;
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    }> = [];

    /**
     * Based on the git version installed and / or the git config set up, there may be a case
     * where `git diff` may render the result in a "pager" - instead of rendering the result inline
     * it will clear the console and the render the result on a new "page"
     *
     * Ref: https://til.hashrocket.com/posts/skwvm5hkvy-configuring-the-pager
     *
     * Turning it off here locally to ensure that `execSync` receives the right stdout output.
     */
    console.log('→ Rewriting local git config to remove pager\n');
    execSync('git config --add pager.diff false');

    /**
     * Runs `git diff --name-status --diff-filter=<filter value> <base branch>
     *
     * --name-status: Ensures that the output of the git diff is just the filenames and the status
     * (modified, added, deleted) and not line diff
     *
     * --diff-filter: Filters the --name-status result to match the filter provided, ie, only
     * modified, only added, only deleted.
     */
    console.log(`→ Looking for modified and newly add files against the "${cliOptions.baseBranch}" branch\n`);
    const modifiedFilesDiff = execSync(
        `git diff --name-status --diff-filter=${MODIFIED_FILE_FILTER} ${cliOptions.baseBranch}`,
        {
            encoding: 'utf8',
        },
    );
    const newFilesDiff = execSync(`git diff --name-status --diff-filter=${NEW_FILE_FILTER} ${cliOptions.baseBranch}`, {
        encoding: 'utf8',
    });

    /**
     * Parses the `git diff` result into an array of files.
     */
    const modifiedFiles = extractFileNames(modifiedFilesDiff, MODIFIED_FILE_FILTER);
    const newFiles = extractFileNames(newFilesDiff, NEW_FILE_FILTER);

    /**
     * Finds all modified and new files that match the provided glob patterns.
     */
    const filteredModifiedFiles = filterFiles(modifiedFiles, (cliOptions.trackGlobs as string).split(','));
    const filteredNewFiles = filterFiles(newFiles, (cliOptions.trackGlobs as string).split(','));

    if (!filteredModifiedFiles.length && !filteredNewFiles.length) {
        console.log('No files match provided TRACK_GLOBS. Skipping...');
        process.exit(0);
    }

    /**
     * Checks for related tests for modified files. Any file that has been modified and has zero related
     * tests is flagged.
     */
    console.log('→ Checking for related tests for modified files\n');
    filteredModifiedFiles.forEach((file) => {
        console.log(file);

        const testsExist = checkTestExistence(file);

        if (!testsExist) {
            console.log('[Fail] No related tests found');
            noTestCasesPresent.push(file);
        } else {
            console.log('[Pass] Tests found');
        }

        console.log('\n');
    });

    /**
     * Checks for related tests for new files. Any file that has been added newly in this branch and has zero related
     * tests is flagged.
     */
    console.log('→ Checking for related tests for new files\n');
    filteredNewFiles.forEach((file) => {
        console.log(file);

        const testsExist = checkTestExistence(file);

        if (!testsExist) {
            console.log('[Fail] No related tests found');
            noTestCasesPresent.push(file);
        } else {
            console.log('[Pass] Tests found');
        }

        console.log('\n');
    });

    if (!cliOptions.skipCoverage) {
        /**
         * Looks for the existence of a coverage file. The coverage file is used for validating coverage
         * metrics for new files.
         */
        console.log(`→ Looking for coverage file present at ${cliOptions.coverageFile}.`);
        console.log('The path can be configured by provided the `--coverageFile` option');
        if (!existsSync(cliOptions.coverageFile as string)) {
            console.log('Coverage file not found!');
            process.exit(-1);
        } else {
            console.log('Coverage file found.\n');
        }

        /**
         * Validates coverage metrics for new files. Any file that does not meet the configured coverage threshold values
         * is flagged.
         */
        console.log('→ Checking for coverage for new files');
        console.log(`Branch Coverage Threshold: ${cliOptions.branchCoverageThreshold}`);
        console.log(`Line Coverage Threshold: ${cliOptions.lineCoverageThreshold}`);
        console.log(`Statement Coverage Threshold: ${cliOptions.statementCoverageThreshold}`);
        console.log(`Function Coverage Threshold: ${cliOptions.functionCoverageThreshold}\n`);

        // Read coverage report, and covert to an Object.
        const coverageReport = JSON.parse(
            readFileSync(cliOptions.coverageFile as string, {
                encoding: 'utf8',
            }),
        );

        filteredNewFiles.forEach((file) => {
            // Extract metrics for file from coverage report
            const testCaseMetrics = coverageReport[`${cliOptions.projectRoot}/${file}`];

            if (testCaseMetrics) {
                const { lines, functions, statements, branches } = testCaseMetrics;

                if (
                    lines.pct < cliOptions.lineCoverageThreshold ||
                    functions.pct < cliOptions.functionCoverageThreshold ||
                    statements.pct < cliOptions.statementCoverageThreshold ||
                    branches.pct < cliOptions.branchCoverageThreshold
                ) {
                    thresholdFailures.push({
                        branches: branches.pct,
                        filename: file,
                        functions: functions.pct,
                        lines: lines.pct,
                        statements: statements.pct,
                    });
                }
            }
        });
    } else {
        console.log(`--skipCoverage set to ${cliOptions.skipCoverage}. Skipping coverage metrics validation...`);
    }

    console.log('\n======== RESULT ========\n');

    if (noTestCasesPresent.length) {
        console.log('❌ No Test Cases found for the following files:\n');
        noTestCasesPresent.forEach((file) => console.log(file));
        console.log('\n');
    }

    if (thresholdFailures.length) {
        console.log('❌ Coverage threshold not met for the following files:\n');
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
     * Utility fails with a non-zero status (error status) if any file has been flagged.
     */
    if (noTestCasesPresent.length || thresholdFailures.length) {
        process.exit(-1);
    }

    console.log('✅ All good!');
    process.exit(0);
}

export default run;
