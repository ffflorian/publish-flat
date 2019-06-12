# publisher [![Build Status](https://action-badges.now.sh/ffflorian/publisher)](https://github.com/ffflorian/publisher/actions/) [![npm version](https://img.shields.io/npm/v/@ffflorian/publisher.svg?style=flat)](https://www.npmjs.com/package/@ffflorian/publisher) [![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=ffflorian/publisher)](https://dependabot.com)

Publish your project without the dist directory.

## Description

Here is what it does:

1. Re-build your project
2. Copy your dist files into a temporary directory
3. Publish your project from the temporary directory

## Installation

```
yarn add @ffflorian/publisher
```

### CLI Usage

```
Usage: cli.ts [options] <dir>

Publish your project without the dist directory

Options:
  -V, --version     output the version number
  -c, --yarn        Use yarn for publishing (default: false)
  -o, --omit <dir>  Which directory to omit (default: "dist")
  -n, --no-publish  Do not publish (default: false)
  -h, --help        output usage information
```

### API Usage

See [`cli.ts`](./src/cli.ts).
