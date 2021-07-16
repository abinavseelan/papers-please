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

export type StatsFieldDataType = {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
};
