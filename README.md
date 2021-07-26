# papers-please
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

> jest-based test case mandating tool for new code.

<img width="100%" src="https://user-images.githubusercontent.com/6417910/116773983-dae16700-aa76-11eb-811c-dd0f2bfbcb1b.gif" alt="PapersPleaseDemoReel" />

## Install 

```
npm install -D papers-please
```

Requires Node 8+ and [Jest](https://jestjs.io/docs/getting-started) 25.x+

⚠️ For coverage reporting, Jest coverage needs be be collected as `json-summary`.

```
// In jest.config.js

{
  coverageReporters: ["json-summary"]
}
```

## Usage

### CLI

```
npx papers-please --trackGlobs="<comma separated list of file globs to track>" --baseBranch="<branch to check file diff against>"
```

Example

```
npx papers-please --trackGlobs="**/src/**/*.js,**/client/**/*.js,**/server/**/*.js" --baseBranch="main"
```

### As an npm script

```
// In your package.json

{
  "scripts": {
    "validate": "npx papers-please --trackGlobs="**/src/**/*.js,**/client/**/*.js,**/server/**/*.js" --baseBranch="main""
  }
}
```

### As a git hook

_papers-please_ can be used alongside [husky](https://typicode.github.io/husky/#/) to run validation on git commit and / or git push.

## Options

| Option                       | Type    | Description                                                                                                                                | Default Value                    |
|------------------------------|---------|--------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|
| --baseBranch                 | string  | Base branch to validate your branch against to derive new and modified files                                                               | origin/main                      |
| --projectRoot                | string  | Root directory for the project. Assume this to be where the .git folder resides                                                            | process.cwd()                    |
| --coverageFile               | string  | Path to the jest coverage report. **Note** The coverage summary report should be the json summary output                                   | ./coverage/coverage-summary.json |
| --skipCoverage               | boolean | Skip coverage metrics validation                                                                                                           | false                            |
| --trackGlobs                 | string  | List of comma-separated source files / globs to track. Any file that is modified or added that matches the glob pattern will be validated. | **/*                             |
| --branchCoverageThreshold    | number  | Branch coverage threshold for new files (in percentage)                                                                                    | 80                               |
| --functionCoverageThreshold  | number  | Function coverage threshold for new files (in percentage)                                                                                  | 80                               |
| --lineCoverageThreshold      | number  | Line coverage threshold for new files (in percentage)                                                                                      | 80                               |
| --statementCoverageThreshold | number  | Statement coverage threshold for new files (in percentage)                                                                                 | 80                               |
| --help                       | boolean | Show usage and available options                                                                                                           | false                            |
| --verbose                    | boolean | Show verbose output for each step                                                                                                          | false                            |
| --exposeMetrics              | boolean | Exposes coverage metrics for the modified/added files which matches the glob pattern                                                       | false                            |

## Contributing

Want to fix something, add a new feature or raise an issue? Please read the [contributing guide](https://github.com/abinavseelan/papers-please/blob/main/CONTRIBUTING.md) to get started. :smile:
## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://abinavseelan.com"><img src="https://avatars.githubusercontent.com/u/6417910?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Abinav Seelan</b></sub></a><br /><a href="https://github.com/abinavseelan/papers-please/commits?author=abinavseelan" title="Code">💻</a> <a href="https://github.com/abinavseelan/papers-please/commits?author=abinavseelan" title="Documentation">📖</a> <a href="#ideas-abinavseelan" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://aditimohanty.com"><img src="https://avatars.githubusercontent.com/u/6426069?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aditi Mohanty</b></sub></a><br /><a href="https://github.com/abinavseelan/papers-please/pulls?q=is%3Apr+reviewed-by%3Arheaditi" title="Reviewed Pull Requests">👀</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!