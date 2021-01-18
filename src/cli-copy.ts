#!/usr/bin/env node

import program from 'commander';
import fs from 'fs-extra';
import path from 'path';

import {copyJson} from './copyJson';

const defaultPackageJsonPath = path.join(__dirname, 'package.json');
const packageJsonPath = fs.existsSync(defaultPackageJsonPath)
  ? defaultPackageJsonPath
  : path.join(__dirname, '../package.json');

const {bin, version} = fs.readJSONSync(packageJsonPath);
const name = Object.keys(bin)[1];

program
  .name(name)
  .version(version)
  .description(`Copy entries from one JSON file to the other (example: "${name} version")`)
  .option('-i, --input <file>', 'Set the input JSON file', './package.json')
  .option('-o, --output <file>', 'Set the output JSON file', '../package.json')
  .parse(process.argv);

const values = program.args;
const commanderOptions = program.opts();

if (!values.length) {
  console.error('No values to copy');
  program.help();
}

copyJson(commanderOptions.input, commanderOptions.output, values).catch(error => {
  console.error(error);
  process.exit(1);
});
