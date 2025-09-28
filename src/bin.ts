#!/usr/bin/env node
import { initCommand } from './commands/init.js';
import { installCommand } from './commands/install.js';
import { cancel, intro, isCancel, outro } from '@clack/prompts';

import pc from 'picocolors';

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
        console.log(pc.yellow('Available commands:'));
        console.log('  fepull init     - Initialize configuration file');
        console.log('  fepull install  - Interactive package installation');
        break;
      default:
        console.log(pc.red(`Unknown command: ${command}`));
        console.log(pc.yellow('Available commands:'));
        console.log('  fepull init     - Initialize configuration file');
        console.log('  fepull install  - Interactive package installation');
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
