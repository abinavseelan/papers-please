# papers-please Contributing Guide

Before submitting your contribution, please take a moment and read through the following guidelines.

- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)

## Pull Request Guidelines

- A preferred convention for branch names is `<task-type>/<description>`. For example:
  - `bugfix/missing-props`
  - `feature/handle-refs`

- As for commit guidelines on your branch, do not fret! 🙂 The commits will be squash merged by the maintainers before merging to `main`.

- Make sure `npm run fmt` passes. This command runs [eslint](https://eslint.org/) to enforce the code-style conventions.

- If there are any changes to the dependencies, please make sure to use `npm` rather than `yarn` and that your changes are reflected in both the `package.json` and `package-lock.json` files.

- If adding a new feature:
  - Describe your use-case / need for the feature, so that we can understand the scenario better.
  - Preferably raise a suggestion issue, so that we can have a discussion before you start working on the PR. 👩‍💻

- If fixing a bug:
  - Reference any open/closed github issues related to this bug.
  - Provide detailed description of the bug in the PR, with reproduction steps, environment details, etc. Screenshots preferred. 🚀

## Development Setup

You will need [Node.js](http://nodejs.org) **version 8+**

After cloning the repo, run:

``` bash
$ npm install
```

To run the cli locally, run:

```bash
$ npm run local
```

To create a build of the cli, run:

```bash
$ npm run build
```

This creates a `/lib` folder with the final distributable.

To install a local build of the cli, run:

```bash
$ npm pack
```

This will generate a tarball file that can be installed globally using `npm install -g <path to tarball>` or install in another test project using `npm install -D <path to tarball>`.


### Committing Changes

There is a `pre-commit` hook that runs the linter to check for code style. Please make sure that any issues that come up during this linter check are fixed when raising the Pull Request.

**Note: If you're using `yarn`, just make sure you aren't committing the yarn lockfile.**

### Commonly used NPM scripts

``` bash
# Runs the example project in `/src/docs`, using webpack-dev-server.
# Use this demo sandbox to test your changes. It has HMR out of the box!
$ npm start

# Check for linting issues.
$ npm run fmt

# Run the CLI locally in the project
$ npm run local
```

## Credits

This file has been adapted from the awesome folks at Vuejs: [VueJS's Contributing Guidelines](https://github.com/vuejs/vue/blob/dev/.github/CONTRIBUTING.md).
