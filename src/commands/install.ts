import { PackageEntry } from '../types/config.js';
import { configExists, readConfig } from '../utils/config.js';
import { directoryExists } from '../utils/fs.js';
import { downloadEntries } from '../utils/git.js';
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

  // Remove existing directories for overwrite entries
  for (const entry of overwriteEntries) {
    if (await directoryExists(entry.target)) {
      await fs.rm(entry.target, { recursive: true, force: true });
    }
  }

  const s3 = spinner();
  s3.start(`Downloading ${toInstall.length} package(s)...`);

  let successCount = 0;
  let failureCount = 0;
  const successList: { name: string; target: string }[] = [];

  try {
    const results = await downloadEntries(toInstall);
    s3.stop('Download complete');

    for (const r of results) {
      if (r.success) {
        const entry = toInstall.find(e => e.name === r.name)!;
        console.log(pc.green(`  ✅ ${r.name} installed successfully`));
        successCount++;
        successList.push({ name: r.name, target: entry.target });
      } else {
        console.log(pc.red(`  ❌ Failed to install ${r.name}`));
        if (r.error) {
          console.log(pc.red(`     Error: ${r.error}`));
        }
        failureCount++;
      }
    }
  } catch (error) {
    s3.stop('Failed to download packages');
    console.log(pc.red(`Error: ${error}`));
    return;
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
