import { CLI_OPTIONS } from './cliOptions';

export default (): void => {
    console.log(`Usage: papers-please [options]\n`);

    console.log('Options:\n');

    CLI_OPTIONS.forEach((option) => {
        console.log(
            `--${option.valueKey.padEnd(30)} ${option.description} (${option.valueType} | default: ${
                option.defaultValue
            })`,
        );
    });
};
