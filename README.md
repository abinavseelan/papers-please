# papers-please

> jest-based test case mandating tool for new code.

<center>
<img width="600" src="https://user-images.githubusercontent.com/6417910/116772849-4fb0a300-aa6f-11eb-9267-151bb3889bb6.gif" alt="PapersPleaseDemoReel" />
</center>

## Install 

```
npm install -D papers-please
```

Requires Node 8+ and [Jest](https://jestjs.io/docs/getting-started) 25.x+

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

_papers-please_ can be used alongside [husky]()

```
// In your package.json

{
  "scripts": {
    "validate": "npx papers-please --trackGlobs="**/src/**/*.js,**/client/**/*.js,**/server/**/*.js" --baseBranch="main""
  }
}
```

