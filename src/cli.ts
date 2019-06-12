#!/usr/bin/env node

import * as program from 'commander';
import {FlatPublisher} from './FlatPublisher';

const getRemainingArgs = require('commander-remaining-args');

const {bin, description, version} = require('../package.json');

program
  .name(Object.keys(bin)[0])
  .version(version)
  .description(description)
  .option('-c, --yarn', 'Use yarn for publishing (default: false)')
  .option('-f, --flatten <dir>', 'Which directory to flatten', 'dist')
  .option('-o, --output <dir>', 'Set the output directory (default: temp directory)')
  .option('-n, --no-publish', 'Do not publish (default: false)')
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
    console.log(outputDir);
    return;
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
