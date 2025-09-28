import { PackageInfo, Source, Target } from '../types/config.js';
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

  if (config.sources.length === 0) {
    console.log(
      pc.yellow(
        'No source repositories configured. Run "fepull init" to add sources.',
      ),
    );
    return;
  }

  if (config.targets.length === 0) {
    console.log(
      pc.yellow(
        'No target directories configured. Run "fepull init" to add targets.',
      ),
    );
    return;
  }

  // Step 1: Select source
  const selectedSource = await selectSource(config.sources);
  if (!selectedSource) return;

  // Step 2: Get packages using sparse checkout
  const s = spinner();
  s.start('Fetching package list...');

  let packages: PackageInfo[];

  try {
    packages = await getPackagesFromSource(selectedSource);
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

  // Step 4: Select target
  const selectedTarget = await selectTarget(config.targets);
  if (!selectedTarget) {
    return;
  }

  // Step 5: Download and install packages using sparse checkout
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
      const targetPath = join(selectedTarget.path, pkg.name);
      await ensureDirectory(selectedTarget.path);
      await downloadPackage(selectedSource, pkg.name, targetPath);
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

async function selectSource(sources: Source[]): Promise<Source | null> {
  const sourceOptions = sources.map(source => ({
    value: source,
    label: source.name,
    hint: source.description || source.url,
  }));

  const selectedSource = await select({
    message: 'Select source repository:',
    options: sourceOptions,
  });

  return selectedSource as Source | null;
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

async function selectTarget(targets: Target[]): Promise<Target | null> {
  const targetOptions = targets.map(target => ({
    value: target,
    label: target.name,
    hint: target.description || target.path,
  }));

  const selectedTarget = await select({
    message: 'Select target directory:',
    options: targetOptions,
  });

  return selectedTarget as Target | null;
}
