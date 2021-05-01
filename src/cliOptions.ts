import { ArrayElement } from './types';

export const CLI_OPTIONS = [
    {
        defaultValue: 'origin/main',
        description: 'Base branch to validate against.',
        valueKey: 'baseBranch',
        valueType: 'string',
    },
    {
        defaultValue: 80,
        description: 'Threshold value for branch coverage',
        valueKey: 'branchCoverageThreshold',
        valueType: 'number',
    },
    {
        defaultValue: './coverage/coverage-summary.json',
        description: 'Path to the jest coverage report',
        valueKey: 'coverageFile',
        valueType: 'string',
    },
    {
        defaultValue: 80,
        description: 'Threshold value for function coverage',
        valueKey: 'functionCoverageThreshold',
        valueType: 'number',
    },
    {
        defaultValue: 80,
        description: 'Threshold value for line coverage',
        valueKey: 'lineCoverageThreshold',
        valueType: 'number',
    },
    {
        defaultValue: process.cwd(),
        description: 'Root directory for the project. Assume this to be where the .git folder resides',
        valueKey: 'projectRoot',
        valueType: 'string',
    },
    {
        defaultValue: false,
        description: 'Skip coverage metrics validation',
        valueKey: 'skipCoverage',
        valueType: 'boolean',
    },
    {
        defaultValue: 80,
        description: 'Threshold value for statement coverage',
        valueKey: 'statementCoverageThreshold',
        valueType: 'number',
    },
    {
        defaultValue: '**/*',
        description:
            'List of source files / globs to track. Any file that is modified or added that matches the file / glob will be validated.',
        valueKey: 'trackGlobs',
        valueType: 'string',
    },
    {
        defaultValue: false,
        description: 'Show options and usage',
        valueKey: 'help',
        valueType: 'boolean',
    },
    {
        defaultValue: false,
        description: 'Display values for options and explicit step details',
        valueKey: 'verbose',
        valueType: 'boolean',
    },
] as const;

export type CLIOptionNames = ArrayElement<typeof CLI_OPTIONS>['valueKey'];
export type CLIOptionObject = Record<CLIOptionNames, string | number | boolean>;

export const getCliOptions = (argv: Record<string, any>): CLIOptionObject => {
    return CLI_OPTIONS.reduce((agg, cliOption) => {
        const { valueKey, defaultValue } = cliOption;
        agg[valueKey] = argv[valueKey] || defaultValue;

        return agg;
    }, {} as CLIOptionObject);
};
