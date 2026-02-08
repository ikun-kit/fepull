import { PackageEntry } from '../types/config.js';
import { configExists, readConfig } from '../utils/config.js';
import { directoryExists } from '../utils/fs.js';
import { downloadSource } from '../utils/git.js';
import { multiselect, spinner } from '@clack/prompts';

import { promises as fs } from 'fs';
import pc from 'picocolors';

export async function installCommand(): Promise<void> {
  if (!(await configExists())) {
    console.log(
      pc.red('No configuration file found. Run "fepull init" first.'),
    );
    return;
  }

  const config = await readConfig();
  if (!config) {
    console.log(pc.red('Failed to read configuration file.'));
    return;
  }

  if (config.packages.length === 0) {
    console.log(
      pc.yellow(
        'No packages configured. Run "fepull init" to add package entries.',
      ),
    );
    return;
  }

  // Check which entries already have target directories
  const newEntries: PackageEntry[] = [];
  const existingEntries: PackageEntry[] = [];

  for (const entry of config.packages) {
    if (await directoryExists(entry.target)) {
      existingEntries.push(entry);
    } else {
      newEntries.push(entry);
    }
  }

  // Determine which existing entries to overwrite
  let overwriteEntries: PackageEntry[] = [];

  if (existingEntries.length > 0) {
    console.log(
      pc.yellow(
        `\n${existingEntries.length} package(s) already exist locally:`,
      ),
    );

    const selected = await multiselect({
      message: 'Select packages to overwrite (enter to skip all):',
      options: existingEntries.map(entry => ({
        value: entry,
        label: entry.name,
        hint: `${entry.target} already exists`,
      })),
      required: false,
    });

    if (Array.isArray(selected)) {
      overwriteEntries = selected as PackageEntry[];
    }
  }

  // Final install list
  const toInstall = [...newEntries, ...overwriteEntries];
  const skippedCount = existingEntries.length - overwriteEntries.length;

  if (toInstall.length === 0) {
    console.log(pc.yellow('No packages to install.'));
    return;
  }

  console.log(
    pc.cyan(`\nInstalling ${toInstall.length} package(s)...\n`),
  );

  let successCount = 0;
  let failureCount = 0;
  const successList: { name: string; target: string }[] = [];

  for (let i = 0; i < toInstall.length; i++) {
    const entry = toInstall[i];
    const s = spinner();
    s.start(`Installing ${entry.name} (${i + 1}/${toInstall.length})...`);

    try {
      // Remove existing directory for overwrite entries
      if (await directoryExists(entry.target)) {
        await fs.rm(entry.target, { recursive: true, force: true });
      }

      await downloadSource(entry.source, entry.target);
      s.stop(`✅ ${entry.name} installed successfully`);
      successCount++;
      successList.push({ name: entry.name, target: entry.target });
    } catch (error) {
      s.stop(`❌ Failed to install ${entry.name}`);
      console.log(pc.red(`   Error: ${error}`));
      failureCount++;
    }
  }

  // Summary
  console.log(pc.cyan('\n📋 Installation Summary:'));
  console.log(pc.green(`✅ ${successCount} package(s) installed successfully`));
  if (skippedCount > 0) {
    console.log(pc.yellow(`⏭️  ${skippedCount} package(s) skipped`));
  }
  if (failureCount > 0) {
    console.log(pc.red(`❌ ${failureCount} package(s) failed to install`));
  }

  if (successList.length > 0) {
    console.log(pc.green('\n📦 Installed packages:'));
    successList.forEach(pkg => {
      console.log(pc.green(`   • ${pkg.name} → ${pkg.target}`));
    });
  }
}
