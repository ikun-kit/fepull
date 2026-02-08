import { PackageEntry, PackageInfo } from '../types/config.js';
import { configExists, readConfig } from '../utils/config.js';
import { ensureDirectory } from '../utils/fs.js';
import { downloadPackage, getPackagesFromSource } from '../utils/git.js';
import { multiselect, select, spinner } from '@clack/prompts';

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

  // Step 1: Select package entry
  const selectedEntry = await selectPackageEntry(config.packages);
  if (!selectedEntry) return;

  // Step 2: Get packages using sparse checkout
  const s = spinner();
  s.start('Fetching package list...');

  let packages: PackageInfo[];

  try {
    packages = await getPackagesFromSource(selectedEntry.source);
    s.stop('Package list fetched successfully');
  } catch (error) {
    s.stop('Failed to fetch package list');
    console.log(pc.red(`Error: ${error}`));
    return;
  }

  if (packages.length === 0) {
    console.log(pc.yellow('No packages found in the source repository.'));
    return;
  }

  // Step 3: Select packages (multi-select)
  const selectedPackages = await selectPackages(packages);
  if (!selectedPackages || selectedPackages.length === 0) {
    console.log(pc.yellow('No packages selected.'));
    return;
  }

  // Step 4: Download and install packages using sparse checkout
  console.log(
    pc.cyan(`\nInstalling ${selectedPackages.length} package(s)...\n`),
  );

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < selectedPackages.length; i++) {
    const pkg = selectedPackages[i];
    const s2 = spinner();
    s2.start(`Installing ${pkg.name} (${i + 1}/${selectedPackages.length})...`);

    try {
      const targetPath = join(selectedEntry.target, pkg.name);
      await ensureDirectory(selectedEntry.target);
      await downloadPackage(selectedEntry.source, pkg.name, targetPath);
      s2.stop(`✅ ${pkg.name} installed successfully`);

      results.push({ name: pkg.name, status: 'success', path: targetPath });
      successCount++;
    } catch (error) {
      s2.stop(`❌ Failed to install ${pkg.name}`);
      console.log(pc.red(`   Error: ${error}`));

      results.push({ name: pkg.name, status: 'failed', error: error });
      failureCount++;
    }
  }

  // Summary
  console.log(pc.cyan('\n📋 Installation Summary:'));
  console.log(pc.green(`✅ ${successCount} package(s) installed successfully`));
  if (failureCount > 0) {
    console.log(pc.red(`❌ ${failureCount} package(s) failed to install`));
  }

  // List successful installations
  const successful = results.filter(r => r.status === 'success');
  if (successful.length > 0) {
    console.log(pc.green('\n📦 Installed packages:'));
    successful.forEach(pkg => {
      console.log(pc.green(`   • ${pkg.name} → ${pkg.path}`));
    });
  }
}

async function selectPackageEntry(
  packages: PackageEntry[],
): Promise<PackageEntry | null> {
  const options = packages.map(pkg => ({
    value: pkg,
    label: pkg.name,
    hint: pkg.description || `${pkg.source.url} → ${pkg.target}`,
  }));

  const selected = await select({
    message: 'Select package source:',
    options,
  });

  return selected as PackageEntry | null;
}

async function selectPackages(
  packages: PackageInfo[],
): Promise<PackageInfo[] | null> {
  const packageOptions = packages.map(pkg => ({
    value: pkg,
    label: pkg.name,
    hint: pkg.description || 'No description',
  }));

  const selectedPackages = await multiselect({
    message:
      'Select packages to install (use space to select, enter to confirm):',
    options: packageOptions,
    required: false,
  });

  return selectedPackages as PackageInfo[] | null;
}
