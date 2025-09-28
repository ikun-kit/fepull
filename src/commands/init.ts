import { CONFIG_FILE, configExists } from '../utils/config.js';

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import pc from 'picocolors';
import { fileURLToPath } from 'url';

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
        await fs.access(examplePath);
        await fs.copyFile(examplePath, CONFIG_FILE);
        exampleFound = true;
        break;
      } catch {
        // Continue to next path
      }
    }

    if (!exampleFound) {
      // Fallback: create a basic default config if example file not found
      const defaultConfig = `sources:
  - name: example-source
    url: https://github.com/your-org/your-repo
    packagesDir: packages
    description: Example source repository

targets:
  - name: components
    path: ./src/components
    description: Project components directory
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
