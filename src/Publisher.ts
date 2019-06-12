import {exec} from 'child_process';
import * as os from 'os';
import * as path from 'path';
import {promisify} from 'util';

import * as fs from 'fs-extra';
import * as logdown from 'logdown';
import * as packlist from 'npm-packlist';

const execAsync = promisify(exec);

export interface PublishOptions {
  /** Which directory to omit (e.g. to move dist/main.js => main.js, use `dist`) */
  dirToOmit: string;
  packageDir: string;
  /** Arguments to forward to npm or yarn */
  publishArguments?: string[];
  /** Use yarn for publishing */
  useYarn?: boolean;
}

type FilesInOmittedDir = Array<{fileName: string; replacedFilename: string}>;

interface Categorized {
  filesInOmittedDir: FilesInOmittedDir;
  normalFiles: string[];
}

export class Publisher {
  private readonly options: PublishOptions;
  private readonly logger: logdown.Logger;
  private readonly packageDir: string;
  private readonly dirToOmit: string;
  private readonly dirToOmitRegex: RegExp;

  constructor(options: PublishOptions) {
    this.options = options;
    this.logger = logdown('publisher', {
      logger: console,
      markdown: false,
    });
    this.logger.state.isEnabled = true;

    this.packageDir = path.resolve(this.options.packageDir);
    this.dirToOmit = this.cleanDirName(this.options.dirToOmit);
    this.dirToOmitRegex = new RegExp(`${this.dirToOmit}[\\/]`);
  }

  private cleanDirName(dirName: string): string {
    const separatorRegex = new RegExp('[\\/]*([^\\/]+)[\\/]*', 'g');
    const cleanName = dirName.trim().replace(separatorRegex, '$1');
    if (!cleanName) {
      throw new Error(`Invalid omit dir "${dirName}" specified`);
    }
    return cleanName;
  }

  private createTempDir(): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), 'publisher-'));
  }

  private async cleanPackageJson(filePath: string, filesInOmittedDir: FilesInOmittedDir): Promise<void> {
    const packageJson = await fs.readJSON(filePath);
    packageJson.files = packageJson.files.map((fileName: string) => fileName.replace(this.dirToOmitRegex, ''));
    packageJson.files = packageJson.files.concat(filesInOmittedDir.map(({replacedFilename}) => replacedFilename));
    packageJson.files = packageJson.files.filter((fileName: string) => fileName !== this.dirToOmit);

    if (typeof packageJson.bin === 'string') {
      packageJson.bin = packageJson.bin.replace(this.dirToOmitRegex, '');
    } else if (typeof packageJson.bin === 'object') {
      for (const binName of Object.keys(packageJson.bin)) {
        packageJson.bin[binName] = packageJson.bin[binName].replace(this.dirToOmitRegex, '');
      }
    }

    if (packageJson.main) {
      packageJson.main = packageJson.main.replace(this.dirToOmitRegex, '');
    }

    const packageJsonString = `${JSON.stringify(packageJson, null, 2)}\n`;
    await fs.writeFile(filePath, packageJsonString, 'utf-8');
  }

  async publish(tempDir: string): Promise<void> {
    this.logger.info(`Publishing package in "${this.packageDir}" ...`);

    const executor = this.options.useYarn ? 'yarn' : 'npm';
    const command = `${executor} publish "${tempDir}" ${this.options.publishArguments}`.trim();

    this.logger.info(`Running "${command}" ...`);

    const {stderr, stdout} = await execAsync(command);

    if (stderr) {
      throw new Error(stderr);
    }

    this.logger.info(stdout);

    await fs.remove(tempDir);
  }

  async build(): Promise<string | void> {
    const files = await packlist({path: this.packageDir});

    this.logger.info('Got files', files);

    if (!files.length) {
      this.logger.info('No files to publish');
      return;
    }

    if (!files.includes('package.json')) {
      throw new Error(`Files don't include a "package.json" file`);
    }

    const {normalFiles, filesInOmittedDir} = files.reduce(
      (result: Categorized, fileName: string) => {
        if (this.dirToOmitRegex.test(fileName)) {
          const replacedFilename = fileName.replace(this.dirToOmitRegex, '');
          result.filesInOmittedDir.push({fileName, replacedFilename});
        } else {
          result.normalFiles.push(fileName);
        }
        return result;
      },
      {normalFiles: [], filesInOmittedDir: []}
    );

    const tempDir = await this.createTempDir();

    for (const file of normalFiles) {
      await fs.copy(path.join(this.packageDir, file), path.join(tempDir, file), {overwrite: true, recursive: true});
    }

    for (const {fileName, replacedFilename} of filesInOmittedDir) {
      await fs.copy(path.join(this.packageDir, fileName), path.join(tempDir, replacedFilename), {
        overwrite: true,
        recursive: true,
      });
    }

    await this.cleanPackageJson(path.join(tempDir, 'package.json'), filesInOmittedDir);

    return tempDir;
  }
}
