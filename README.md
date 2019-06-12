# publish-flat [![Build Status](https://action-badges.now.sh/ffflorian/publish-flat)](https://github.com/ffflorian/publish-flat/actions/) [![npm version](https://img.shields.io/npm/v/publish-flat.svg?style=flat)](https://www.npmjs.com/package/publish-flat) [![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=ffflorian/publish-flat)](https://dependabot.com)

Publish your project flattened. No more `require('dependency/dist/Options')`.

## Description

Here is what it does:

1. Re-builds your project
2. Copies your dist files together with the other release files into a temporary directory
3. Aligns your `package.json` to work with the flattened structure
4. Publishes your project from the temporary directory (optional)

## Installation

```
yarn add publish-flat
```

### CLI Usage

```
Usage: publish-flat [options] [dir]

Publish your project without the dist directory

Options:
  -V, --version        output the version number
  -c, --yarn           Use yarn for publishing (default: false)
  -f, --flatten <dir>  Which directory to flatten (default: "dist")
  -o, --output <dir>   Set the output directory (default: temp directory)
  -p, --publish        Publish (default: false)
  -h, --help           output usage information
```

### API Usage

See [`cli.ts`](./src/cli.ts).
