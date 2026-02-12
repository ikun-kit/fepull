import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import pc from 'picocolors';

import { CONFIG_FILE, configExists } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initCommand(): Promise<void> {
  if (await configExists()) {
    console.log(pc.yellow('Configuration file already exists.'));
    console.log(pc.gray('Remove fepull.config.yml to regenerate.'));
    return;
  }

  console.log(pc.cyan('Creating fepull configuration file...\n'));

  try {
    // Try to find the example config file
    // In development: ../../fepull.config.example.yml
    // In npm package: ../fepull.config.example.yml
    const possiblePaths = [
      join(__dirname, '../../fepull.config.example.yml'), // Development
      join(__dirname, '../fepull.config.example.yml'), // npm package
    ];

    let exampleFound = false;

    for (const examplePath of possiblePaths) {
      try {
        // eslint-disable-next-line no-await-in-loop -- sequential: try paths one by one, break on first success
        await fs.access(examplePath);
        // eslint-disable-next-line no-await-in-loop
        await fs.copyFile(examplePath, CONFIG_FILE);
        exampleFound = true;
        break;
      } catch {
        // Continue to next path
      }
    }

    if (!exampleFound) {
      // Fallback: create a basic default config if example file not found
      const defaultConfig = `packages:
  - name: example-source
    source:
      url: https://github.com/your-org/your-repo
      packagesDir: packages
    target: ./src/components
    description: Example source repository
`;
      await fs.writeFile(CONFIG_FILE, defaultConfig);
    }

    console.log(pc.green('✅ Created fepull.config.yml'));
    console.log(pc.cyan('\nNext steps:'));
    console.log(
      pc.gray(
        '  1. Edit fepull.config.yml to configure your sources and targets',
      ),
    );
    console.log(pc.gray('  2. Run "fepull install" to install packages'));
  } catch (error) {
    console.error(pc.red('Failed to create configuration file:'), error);
    process.exit(1);
  }
}
