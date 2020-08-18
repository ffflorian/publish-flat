#!/usr/bin/env node

import program from 'commander';
import fs from 'fs-extra';
import path from 'path';

import {PublishFlat} from './PublishFlat';

const defaultPackageJsonPath = path.join(__dirname, 'package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../package.json');

const {bin, description, version} = fs.readJSONSync(packageJsonPath);

program
  .name(Object.keys(bin)[0])
  .version(version)
  .description(description)
  .option('-y, --yarn', 'Use yarn for publishing (default: false)')
  .option('-f, --flatten <dir>', 'Which directory to flatten', 'dist')
  .option('-o, --output <dir>', 'Set the output directory (default: temp directory)')
  .option('-p, --publish', 'Publish (default: false)')
  .arguments('[dir]')
  .allowUnknownOption()
  .parse(process.argv);

const flatPublisher = new PublishFlat({
  dirToFlatten: program.flatten,
  outputDir: program.output,
  packageDir: program.dir || '.',
  publishArguments: program.args,
  useYarn: program.yarn || false,
});

void (async () => {
  try {
    const outputDir = await flatPublisher.build();
    if (program.publish && outputDir) {
      await flatPublisher.publish(outputDir);
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
