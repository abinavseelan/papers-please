import micromatch from 'micromatch';
import ora from 'ora';
import { execSync } from 'child_process';
import fs, { existsSync, readFileSync } from 'fs';
import chalk from 'chalk';

import { NEW_FILE_FILTER, MODIFIED_FILE_FILTER, DEFAULT_METRIC_VALUE } from './constants';
import { CLIOptionObject } from './cliOptions';
import { CoverageFailureData, StatsFieldDataType } from './types';

export function logger(str: string, verbose: boolean): void {
    if (verbose) {
        console.log(chalk.gray(`[verbose] ${str}`));
    }
}

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
export function extractFileNames(
    results: string,
    diffFilter: typeof NEW_FILE_FILTER | typeof MODIFIED_FILE_FILTER,
): string[] {
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
export function filterFiles(fileType: string, files: string[], globList: string[], verbose = false): string[] {
    const spinner = ora(`Filtering ${fileType} files that match --trackGlobs`);
    spinner.start();

    const matchedFiles = micromatch(files, globList);

    spinner.text = `Filtering ${fileType} files that match --trackGlobs (Found ${matchedFiles.length} file(s))`;
    spinner.succeed();

    matchedFiles.forEach((file) => {
        logger(file, verbose);
    });

    return matchedFiles;
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
export function checkTestExistence(file: string): number {
    const stdout = execSync(`./node_modules/.bin/jest --findRelatedTests --listTests ${file}`, {
        stdio: 'pipe',
        encoding: 'utf8',
    });

    return stdout.split('\n').filter(Boolean).length;
}

/**
 * Based on the git version installed and / or the git config set up, there may be a case
 * where `git diff` may render the result in a "pager" - instead of rendering the result inline
 * it will clear the console and the render the result on a new "page"
 *
 * Ref: https://til.hashrocket.com/posts/skwvm5hkvy-configuring-the-pager
 *
 * Turning it off here locally to ensure that `execSync` receives the right stdout output.
 */
export function overrideGitPager(): void {
    const spinner = ora('Rewriting local git config to remove pager');
    spinner.start();
    execSync('git config --add pager.diff false');
    spinner.succeed();
}

export function performGitFetch(): void {
    const spinner = ora('Running a `git fetch`');
    spinner.start();
    execSync('git fetch');
    spinner.succeed();
}

/**
 * Runs `git diff --name-status --diff-filter=<filter value> <base branch>
 *
 * --name-status: Ensures that the output of the git diff is just the filenames and the status
 * (modified, added, deleted) and not line diff
 *
 * --diff-filter: Filters the --name-status result to match the filter provided, ie, only
 * modified, only added, only deleted.
 */
export function parseGitDiff(
    fileType: string,
    filter: typeof MODIFIED_FILE_FILTER | typeof NEW_FILE_FILTER,
    baseBranch: string,
    verbose: boolean,
): string[] {
    const spinner = ora(`Looking for ${chalk.blue(fileType)} files against the "${chalk.blue(baseBranch)}" branch`);
    spinner.start();
    const result = execSync(`git diff --name-status --diff-filter=${filter} ${baseBranch}`, {
        encoding: 'utf8',
    });

    const files = extractFileNames(result, filter);
    spinner.succeed();

    files.forEach((file) => logger(chalk.gray(file), verbose));

    return files;
}

/**
 * Checks for related tests for modified files. Any file that has been modified and has zero related
 * tests is flagged.
 */
export function getFilesWithNoTests(fileType: string, files: string[], verbose = false): string[] {
    const spinner = ora(`Checking for related tests for ${fileType} files`);
    console.log(chalk.gray('Based on the size of the codebase, this may take some time'));

    spinner.start();

    const noTestCasesPresent: string[] = [];

    files.forEach((file, index) => {
        const testsExist = checkTestExistence(file);

        if (!testsExist) {
            noTestCasesPresent.push(file);
        }

        spinner.stopAndPersist({
            text: `Checking for related tests for ${fileType} files (${index + 1}/${files.length} files)`,
        });
    });

    spinner.succeed();

    noTestCasesPresent.forEach((file) => {
        logger(chalk.red(`[Fail] No related tests found for ${file}`), verbose);
    });

    return noTestCasesPresent;
}

/**
 * Looks for the existence of a coverage file. The coverage file is used for validating coverage
 * metrics for new files.
 */
export function validateCoverageFile(coverageFile: string): void {
    const spinner = ora(`Looking for coverage file present at ${coverageFile}`);
    spinner.start();

    if (!existsSync(coverageFile as string)) {
        spinner.fail();
        console.log(chalk.red('Coverage file not found!'));
        console.log(chalk.gray('\nThe path can be configured by provided the `--coverageFile` option'));
        process.exit(-1);
    } else {
        spinner.succeed();
        console.log(chalk.green('Coverage file found.\n'));
    }
}

export function getCoverageReport(coverageFile: string): Record<string, any> {
    const spinner = ora('Reading coverage file');
    spinner.start();
    // Read coverage report, and covert to an Object.
    const coverageReport = JSON.parse(
        readFileSync(coverageFile as string, {
            encoding: 'utf8',
        }),
    );

    spinner.succeed();

    return coverageReport;
}

export function validateCoverageMetrics(
    coverageReport: Record<string, any>,
    files: string[],
    cliOptions: CLIOptionObject,
): CoverageFailureData[] {
    const spinner = ora('Validating coverage metrics for new files');
    spinner.start();

    const failures: CoverageFailureData[] = [];
    const fileMetrics: CoverageFailureData[] = [];
    const coverageMetrics: any[] = [];

    files.forEach((file) => {
        // Extract metrics for file from coverage report
        const testCaseMetrics = coverageReport[`${cliOptions.projectRoot}/${file}`];

        if (testCaseMetrics) {
            const { lines, functions, statements, branches } = testCaseMetrics;

            coverageMetrics.push({ lines, functions, branches, name: file });

            fileMetrics.push({
                branches: branches.pct,
                filename: file,
                functions: functions.pct,
                lines: lines.pct,
                statements: statements.pct,
            });

            if (
                lines.pct < cliOptions.lineCoverageThreshold ||
                functions.pct < cliOptions.functionCoverageThreshold ||
                statements.pct < cliOptions.statementCoverageThreshold ||
                branches.pct < cliOptions.branchCoverageThreshold
            ) {
                failures.push({
                    branches: branches.pct,
                    filename: file,
                    functions: functions.pct,
                    lines: lines.pct,
                    statements: statements.pct,
                });
            }
        }
    });

    if (cliOptions.exposeMetrics && coverageMetrics.length) {
        exposeCoverageMetrics(coverageMetrics, cliOptions.projectRoot);
    }

    spinner.succeed();

    fileMetrics.forEach((metric) => {
        logger(JSON.stringify(metric), cliOptions.verbose as boolean);
    });

    return failures;
}

function getFormattedMetricData(coverageData: StatsFieldDataType) {
    const { skipped, covered, pct } = coverageData;
    return {
        missed: { ...DEFAULT_METRIC_VALUE.missed, value: skipped },
        covered: { ...DEFAULT_METRIC_VALUE.covered, value: covered },
        percentage: { ...DEFAULT_METRIC_VALUE.percentage, value: pct },
    };
}

function getAggregatedMetrics(metricsList: any[]) {
    const aggData: any = {
        lines: { total: 0, covered: 0, skipped: 0 },
        branches: { total: 0, covered: 0, skipped: 0 },
        functions: { total: 0, covered: 0, skipped: 0 },
    };

    metricsList.forEach((metric: any) => {
        const { lines, functions, branches } = metric;

        aggData.lines.total += lines.total;
        aggData.lines.covered += lines.covered;
        aggData.lines.skipped += lines.skipped;

        aggData.functions.total += functions.total;
        aggData.functions.covered += functions.covered;
        aggData.functions.skipped += functions.skipped;

        aggData.branches.total += branches.total;
        aggData.branches.covered += branches.covered;
        aggData.branches.skipped += branches.skipped;
    });

    for (const key: string in aggData) {
        const { total, covered } = aggData[key];

        let pct: number = (covered / total) * 100;
        if (!Number.isInteger(pct)) {
            pct = parseFloat(pct.toFixed(2));
        }
        aggData[key].pct = pct;
    }

    return aggData;
}

export function exposeCoverageMetrics(coverageMetrics: Record<string, any>[], projectRoot: any): void {
    const moduleData: any[] = [];

    coverageMetrics.forEach((metric) => {
        const { lines, functions, branches, name } = metric;

        moduleData.push({
            name: { ...DEFAULT_METRIC_VALUE.name, value: name },
            stats: {
                line: getFormattedMetricData(lines),
                branch: getFormattedMetricData(branches),
                method: getFormattedMetricData(functions),
            },
        });
    });

    const { lines, functions, branches } = getAggregatedMetrics(coverageMetrics);

    const coverageReportData = {
        name: { ...DEFAULT_METRIC_VALUE.name, value: 'MAP-UNIT_TEST' },
        stats: {
            line: getFormattedMetricData(lines),
            branch: getFormattedMetricData(branches),
            method: getFormattedMetricData(functions),
        },
        modules: moduleData,
    };

    fs.writeFile(`${projectRoot}/coverage-metrics.json`, JSON.stringify(coverageReportData), (err) => {
        if (err) throw err;
    });
}
