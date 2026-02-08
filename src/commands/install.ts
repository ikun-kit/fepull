import { PackageInfo } from '../types/config.js';
import { configExists, readConfig } from '../utils/config.js';
import { directoryExists, ensureDirectory } from '../utils/fs.js';
import { downloadPackage, getPackagesFromSource } from '../utils/git.js';
import { multiselect, spinner } from '@clack/prompts';

import { join } from 'path';
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

  let totalSuccess = 0;
  let totalFailure = 0;
  let totalSkipped = 0;

  for (const entry of config.packages) {
    console.log(pc.cyan(`\n📦 Processing entry: ${entry.name}`));

    // Fetch available packages from source
    const s = spinner();
    s.start('Fetching package list...');

    let packages: PackageInfo[];

    try {
      packages = await getPackagesFromSource(entry.source);
      s.stop('Package list fetched successfully');
    } catch (error) {
      s.stop('Failed to fetch package list');
      console.log(pc.red(`Error: ${error}`));
      continue;
    }

    if (packages.length === 0) {
      console.log(pc.yellow('No packages found in the source repository.'));
      continue;
    }

    // Split packages into new and existing
    const newPackages: PackageInfo[] = [];
    const existingPackages: PackageInfo[] = [];

    for (const pkg of packages) {
      const targetPath = join(entry.target, pkg.name);
      if (await directoryExists(targetPath)) {
        existingPackages.push(pkg);
      } else {
        newPackages.push(pkg);
      }
    }

    // Determine which existing packages to overwrite
    let overwritePackages: PackageInfo[] = [];

    if (existingPackages.length > 0) {
      console.log(
        pc.yellow(
          `\n${existingPackages.length} package(s) already exist in ${entry.target}:`,
        ),
      );

      const selected = await multiselect({
        message: 'Select packages to overwrite (enter to skip all):',
        options: existingPackages.map(pkg => ({
          value: pkg,
          label: pkg.name,
          hint: 'already exists',
        })),
        required: false,
      });

      if (Array.isArray(selected)) {
        overwritePackages = selected as PackageInfo[];
      }
    }

    // Final install list
    const toInstall = [...newPackages, ...overwritePackages];

    if (toInstall.length === 0) {
      console.log(pc.yellow('No packages to install for this entry.'));
      totalSkipped += packages.length;
      continue;
    }

    const skippedCount = existingPackages.length - overwritePackages.length;
    totalSkipped += skippedCount;

    console.log(
      pc.cyan(`\nInstalling ${toInstall.length} package(s)...\n`),
    );

    // Download packages
    for (let i = 0; i < toInstall.length; i++) {
      const pkg = toInstall[i];
      const s2 = spinner();
      s2.start(`Installing ${pkg.name} (${i + 1}/${toInstall.length})...`);

      try {
        const targetPath = join(entry.target, pkg.name);
        await ensureDirectory(entry.target);
        await downloadPackage(entry.source, pkg.name, targetPath);
        s2.stop(`✅ ${pkg.name} installed successfully`);
        totalSuccess++;
      } catch (error) {
        s2.stop(`❌ Failed to install ${pkg.name}`);
        console.log(pc.red(`   Error: ${error}`));
        totalFailure++;
      }
    }
  }

  // Summary
  console.log(pc.cyan('\n📋 Installation Summary:'));
  console.log(pc.green(`✅ ${totalSuccess} package(s) installed successfully`));
  if (totalSkipped > 0) {
    console.log(pc.yellow(`⏭️  ${totalSkipped} package(s) skipped`));
  }
  if (totalFailure > 0) {
    console.log(pc.red(`❌ ${totalFailure} package(s) failed to install`));
  }
}
