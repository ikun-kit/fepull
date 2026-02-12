#!/usr/bin/env node
import { createRequire } from 'module';

import { cancel, intro, isCancel, outro } from '@clack/prompts';
import pc from 'picocolors';

import { initCommand } from './commands/init.js';
import { installCommand } from './commands/install.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

function printHelp() {
  console.log(`fepull v${version}`);
  console.log('\nUsage: fepull <command> [options]');
  console.log('\nCommands:');
  console.log('  init       Initialize configuration file');
  console.log('  install    Interactive package installation');
  console.log('\nOptions:');
  console.log('  -v, --version    Show version number');
  console.log('  -h, --help       Show help');
}

// Handle process signals for graceful shutdown
function setupSignalHandlers() {
  const handleSignal = (signal: string) => {
    console.log(pc.yellow(`\n${signal} received. Exiting...`));
    process.exit(0);
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));
}

async function main() {
  setupSignalHandlers();

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '-v' || command === '--version') {
    console.log(version);
    return;
  }

  if (command === '-h' || command === '--help') {
    printHelp();
    return;
  }

  intro(pc.bgBlue(pc.black(' fepull ')));

  try {
    switch (command) {
      case 'init':
        await initCommand();
        break;
      case 'install':
        await installCommand();
        break;
      case undefined:
        printHelp();
        break;
      default:
        console.log(pc.red(`Unknown command: ${command}`));
        printHelp();
        process.exit(1);
    }

    outro(pc.green('Done!'));
  } catch (error) {
    if (isCancel(error)) {
      cancel('Operation cancelled');
      process.exit(0);
    } else {
      console.error(pc.red('Error:'), error);
      process.exit(1);
    }
  }
}

main().catch(console.error);
