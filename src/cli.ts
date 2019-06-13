#!/usr/bin/env node

import * as program from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';

import {FlatPublisher} from './FlatPublisher';

const getRemainingArgs = require('commander-remaining-args');

const defaultPackageJsonPath = path.join(__dirname, 'package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../package.json');

const {bin, description, version} = fs.readJSONSync(packageJsonPath);

program
  .name(Object.keys(bin)[0])
  .version(version)
  .description(description)
  .option('-c, --yarn', 'Use yarn for publishing (default: false)')
  .option('-f, --flatten <dir>', 'Which directory to flatten', 'dist')
  .option('-o, --output <dir>', 'Set the output directory (default: temp directory)')
  .option('-p, --publish', 'Publish (default: false)')
  .arguments('[dir]')
  .allowUnknownOption()
  .parse(process.argv);

const remainingArgs = getRemainingArgs(program);

const flatPublisher = new FlatPublisher({
  dirToFlatten: program.flatten,
  outputDir: program.output,
  packageDir: program.dir || '.',
  publishArguments: remainingArgs,
  useYarn: program.yarn || false,
});

flatPublisher
  .build()
  .then(outputDir => {
    if (program.publish && outputDir) {
      return flatPublisher.publish(outputDir);
    }
    return;
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
