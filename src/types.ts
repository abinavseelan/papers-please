export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
    ? ElementType
    : never;

export type CoverageFailureData = {
    filename: string;
    branches: number;
    functions: number;
    lines: number;
    statements: number;
};

export type MetricFieldData = Record<'total' | 'covered' | 'skipped' | 'pct', number>;

export type CoverageMetricsData = {
    lines: MetricFieldData;
    functions: MetricFieldData;
    branches: MetricFieldData;
    name: string;
};

type CommonCoverageInfoField = Record<'text' | 'type', string>;

type LineBranchMethodDataType = Record<
    'missed' | 'covered' | 'percentage',
    CommonCoverageInfoField & { value: number }
>;

export type CoverageModuleData = {
    name: CommonCoverageInfoField & { value: string };
    stats: Record<'line' | 'branch' | 'method', LineBranchMethodDataType>;
};
