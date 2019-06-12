#!/usr/bin/env node

import * as program from 'commander';
import {Publisher} from './Publisher';

const getRemainingArgs = require('commander-remaining-args');

const {bin, description, version} = require('../package.json');

program
  .name(Object.keys(bin)[0])
  .version(version)
  .description(description)
  .option('-c, --yarn', 'Use yarn for publishing (default: false)')
  .option('-o, --omit <dir>', 'Which directory to omit', 'dist')
  .option('-n, --no-publish', 'Do not publish (default: false)')
  .arguments('[dir]')
  .allowUnknownOption()
  .parse(process.argv);

const remainingArgs = getRemainingArgs(program);

const publisher = new Publisher({
  dirToOmit: program.omit,
  packageDir: program.dir || '.',
  publishArguments: remainingArgs,
  useYarn: program.yarn || false,
});

publisher
  .build()
  .then(tempDir => {
    if (program.publish && tempDir) {
      return publisher.publish(tempDir);
    }
    console.log(tempDir);
    return;
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
