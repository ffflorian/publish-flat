import * as os from 'os';
import * as path from 'path';

import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs-extra';
import * as logdown from 'logdown';
import * as packlist from 'npm-packlist';

export interface PublishOptions {
  /** Which directory to flatten (e.g. to move dist/main.js => main.js, use `dist`) */
  dirToFlatten: string;
  outputDir?: string;
  packageDir: string;
  /** Arguments to forward to npm or yarn */
  publishArguments?: string[];
  /** Use yarn for publishing */
  useYarn?: boolean;
}

type FilesInFlattenedDir = Array<{fileName: string; replacedFilename: string}>;

interface Categorized {
  filesInFlattenedDir: FilesInFlattenedDir;
  normalFiles: string[];
}

export class PublishFlat {
  private readonly options: PublishOptions;
  private readonly logger: logdown.Logger;
  private readonly packageDir: string;
  private readonly dirToFlatten: string;
  private readonly dirToFlattenRegex: RegExp;

  constructor(options: PublishOptions) {
    this.options = options;
    this.logger = logdown('publish-flat', {
      logger: console,
      markdown: false,
    });
    this.logger.state.isEnabled = true;

    this.packageDir = path.resolve(this.options.packageDir);
    this.dirToFlatten = this.cleanDirName(this.options.dirToFlatten);
    this.dirToFlattenRegex = new RegExp(`${this.dirToFlatten}[\\/]`);
  }

  async publish(tempDir: string): Promise<void> {
    this.logger.info(`Publishing "${this.packageDir}" ...`);

    const executor = this.options.useYarn ? 'yarn' : 'npm';
    const args = ['publish', `"${tempDir}"`].concat(this.options.publishArguments || []);

    this.logger.info(`Running "${executor} ${args.join(' ')}" ...`);

    const {stdout} = await spawnAsync(executor, args, {shell: true, windowsHide: true});

    if (stdout) {
      this.logger.info(stdout);
    }

    await fs.remove(tempDir);
  }

  async build(): Promise<string | void> {
    const files = await packlist({path: this.packageDir});

    if (!files.length) {
      this.logger.info('No files to publish');
      return;
    }

    if (!files.includes('package.json')) {
      throw new Error(`Files don't include a "package.json" file`);
    }

    const {normalFiles, filesInFlattenedDir: filesInFlattenedDir} = files.reduce(
      (result: Categorized, fileName: string) => {
        if (this.dirToFlattenRegex.test(fileName)) {
          const replacedFilename = fileName.replace(this.dirToFlattenRegex, '');
          result.filesInFlattenedDir.push({fileName, replacedFilename});
        } else {
          result.normalFiles.push(fileName);
        }
        return result;
      },
      {normalFiles: [], filesInFlattenedDir: []}
    );

    const outputDir = this.options.outputDir ? path.resolve(this.options.outputDir) : await this.createTempDir();

    for (const file of normalFiles) {
      await fs.copy(path.join(this.packageDir, file), path.join(outputDir, file), {overwrite: true, recursive: true});
    }

    for (const {fileName, replacedFilename} of filesInFlattenedDir) {
      await fs.copy(path.join(this.packageDir, fileName), path.join(outputDir, replacedFilename), {
        overwrite: true,
        recursive: true,
      });
    }

    this.logger.info(`Flattened ${files.length} files in "${outputDir}".`);

    await this.cleanPackageJson(path.join(outputDir, 'package.json'), filesInFlattenedDir);

    return outputDir;
  }

  private cleanDirName(dirName: string): string {
    const separatorRegex = new RegExp('[\\/]*([^\\/]+)[\\/]*', 'g');
    const cleanName = dirName.trim().replace(separatorRegex, '$1');
    if (!cleanName) {
      throw new Error(`Invalid flatten dir "${dirName}" specified`);
    }
    return cleanName;
  }

  private createTempDir(): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), 'publish-flat-'));
  }

  private async cleanPackageJson(filePath: string, filesInFlattenedDir: FilesInFlattenedDir): Promise<void> {
    const packageJson = await fs.readJSON(filePath);
    packageJson.files = packageJson.files.map((fileName: string) => fileName.replace(this.dirToFlattenRegex, ''));
    packageJson.files = packageJson.files.concat(filesInFlattenedDir.map(({replacedFilename}) => replacedFilename));
    packageJson.files = packageJson.files.filter((fileName: string) => fileName !== this.dirToFlatten);

    if (typeof packageJson.bin === 'string') {
      packageJson.bin = packageJson.bin.replace(this.dirToFlattenRegex, '');
    } else if (typeof packageJson.bin === 'object') {
      for (const binName in packageJson.bin) {
        packageJson.bin[binName] = packageJson.bin[binName].replace(this.dirToFlattenRegex, '');
      }
    }

    if (packageJson.main) {
      packageJson.main = packageJson.main.replace(this.dirToFlattenRegex, '');
    }

    const packageJsonString = `${JSON.stringify(packageJson, null, 2)}\n`;
    await fs.writeFile(filePath, packageJsonString, 'utf-8');
  }
}
