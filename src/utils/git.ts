import { PackageInfo, PackageSource } from '../types/config.js';

import { promises as fs } from 'fs';
import { join } from 'path';
import { SimpleGit, simpleGit } from 'simple-git';

// Create git with timeout and error handling
function createGit(workingDir?: string) {
  return simpleGit({
    baseDir: workingDir,
    timeout: {
      block: 30000, // 30 seconds
    },
  });
}

async function checkoutRemoteBranch(git: SimpleGit): Promise<void> {
  const commonBranches = ['main', 'master', 'develop'];
  let checkedOut = false;
  let lastError: any = null;

  for (const branch of commonBranches) {
    try {
      await git.checkout([`origin/${branch}`]);
      checkedOut = true;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!checkedOut) {
    try {
      const branches = await git.branch(['-r']);
      const remoteBranches = branches.all.filter(
        b => b.startsWith('origin/') && !b.includes('HEAD'),
      );
      if (remoteBranches.length > 0) {
        await git.checkout([remoteBranches[0]]);
        checkedOut = true;
      }
    } catch {
      for (const branch of commonBranches) {
        try {
          await git.checkout([branch]);
          checkedOut = true;
          break;
        } catch {
          // Continue
        }
      }
    }
  }

  if (!checkedOut) {
    throw new Error(
      `Failed to checkout any branch. Last error: ${lastError?.message || lastError || 'Unknown error'}`,
    );
  }
}

export async function getPackagesFromSource(
  source: PackageSource,
): Promise<PackageInfo[]> {
  const tempDir = await createTempDir();
  const git = createGit(tempDir);

  try {
    await git.init();
    await git.addRemote('origin', source.url);
    await git.raw(['config', 'core.sparseCheckout', 'true']);

    const sparseCheckoutPath = join(tempDir, '.git', 'info', 'sparse-checkout');
    await fs.writeFile(sparseCheckoutPath, `${source.packagesDir}/\n`);

    try {
      await git.fetch(['origin', '--depth=1']);
    } catch (fetchError: any) {
      throw new Error(
        `Failed to fetch repository: ${fetchError?.message || fetchError}`,
      );
    }

    await checkoutRemoteBranch(git);

    const packagesPath = join(tempDir, source.packagesDir);
    const packages: PackageInfo[] = [];

    try {
      const entries = await fs.readdir(packagesPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageInfo: PackageInfo = {
            name: entry.name,
            path: join(packagesPath, entry.name),
          };

          try {
            const packageJsonPath = join(
              packagesPath,
              entry.name,
              'package.json',
            );
            const packageJsonContent = await fs.readFile(
              packageJsonPath,
              'utf-8',
            );
            const packageJson = JSON.parse(packageJsonContent);
            packageInfo.description = packageJson.description;
          } catch {
            // Package.json not found or invalid, continue without description
          }

          packages.push(packageInfo);
        }
      }
    } catch {
      // Directory might not exist or be accessible
    }

    return packages;
  } finally {
    await cleanupTempDir(tempDir);
  }
}

export async function downloadSource(
  source: PackageSource,
  targetDir: string,
): Promise<void> {
  const tempDir = await createTempDir();
  const git = createGit(tempDir);

  try {
    await git.init();
    await git.addRemote('origin', source.url);
    await git.raw(['config', 'core.sparseCheckout', 'true']);

    const sparseCheckoutPath = join(tempDir, '.git', 'info', 'sparse-checkout');
    await fs.writeFile(sparseCheckoutPath, `${source.packagesDir}/\n`);

    try {
      await git.fetch(['origin', '--depth=1']);
    } catch (fetchError: any) {
      throw new Error(
        `Failed to fetch repository: ${fetchError?.message || fetchError}`,
      );
    }

    await checkoutRemoteBranch(git);

    const sourcePath = join(tempDir, source.packagesDir);
    const { copyDirectory } = await import('./fs.js');
    await copyDirectory(sourcePath, targetDir);
  } finally {
    await cleanupTempDir(tempDir);
  }
}

export async function downloadPackage(
  source: PackageSource,
  packageName: string,
  targetDir: string,
): Promise<void> {
  const tempDir = await createTempDir();
  const git = createGit(tempDir);

  try {
    await git.init();
    await git.addRemote('origin', source.url);
    await git.raw(['config', 'core.sparseCheckout', 'true']);

    const sparseCheckoutPath = join(tempDir, '.git', 'info', 'sparse-checkout');
    const packagePath = `${source.packagesDir}/${packageName}/`;
    await fs.writeFile(sparseCheckoutPath, `${packagePath}\n`);

    try {
      await git.fetch(['origin', '--depth=1']);
    } catch (fetchError: any) {
      throw new Error(
        `Failed to fetch repository: ${fetchError?.message || fetchError}`,
      );
    }

    await checkoutRemoteBranch(git);

    const sourcePackagePath = join(tempDir, source.packagesDir, packageName);
    const { copyDirectory } = await import('./fs.js');
    await copyDirectory(sourcePackagePath, targetDir);
  } finally {
    await cleanupTempDir(tempDir);
  }
}

export async function createTempDir(): Promise<string> {
  const tempDir = join(process.cwd(), '.fepull-temp-' + Date.now());
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}
