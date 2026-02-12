import { promises as fs } from 'fs';
import { join } from 'path';

import { SimpleGit, simpleGit } from 'simple-git';

import { PackageEntry, PackageInfo, PackageSource } from '../types/config.js';

// Create git with timeout and error handling
function createGit(workingDir?: string) {
  return simpleGit({
    baseDir: workingDir,
    timeout: {
      block: 30000, // 30 seconds
    },
  });
}

// Retry with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelay = 1000 } = {},
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential: retry must wait for each attempt
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `  Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay / 1000}s...`,
      );
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('retry: exhausted all attempts');
}

// Apply git transport settings to avoid common fetch failures
async function configureGitTransport(git: SimpleGit): Promise<void> {
  await git.raw(['config', 'http.postBuffer', '524288000']);
  await git.raw(['config', 'http.version', 'HTTP/1.1']);
  await git.raw(['config', 'http.lowSpeedLimit', '1000']);
  await git.raw(['config', 'http.lowSpeedTime', '30']);
}

async function checkoutRemoteBranch(git: SimpleGit): Promise<void> {
  const commonBranches = ['main', 'master', 'develop'];
  let checkedOut = false;
  let lastError: any = null;

  for (const branch of commonBranches) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential: try branches one by one
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
          // eslint-disable-next-line no-await-in-loop -- sequential: try branches one by one
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
    await configureGitTransport(git);

    const sparseCheckoutPath = join(tempDir, '.git', 'info', 'sparse-checkout');
    await fs.writeFile(sparseCheckoutPath, `${source.packagesDir}/\n`);

    try {
      await retry(() => git.fetch(['origin', '--depth=1']));
    } catch (fetchError: any) {
      throw new Error(
        `Failed to fetch repository: ${fetchError?.message || fetchError}`, { cause: fetchError },
      );
    }

    await checkoutRemoteBranch(git);

    const packagesPath = join(tempDir, source.packagesDir);
    const packages: PackageInfo[] = [];

    try {
      const entries = await fs.readdir(packagesPath, { withFileTypes: true });
      const dirEntries = entries.filter(e => e.isDirectory());

      const results = await Promise.all(
        dirEntries.map(async entry => {
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

          return packageInfo;
        }),
      );
      packages.push(...results);
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
    await configureGitTransport(git);

    const sparseCheckoutPath = join(tempDir, '.git', 'info', 'sparse-checkout');
    await fs.writeFile(sparseCheckoutPath, `${source.packagesDir}/\n`);

    try {
      await retry(() => git.fetch(['origin', '--depth=1']));
    } catch (fetchError: any) {
      throw new Error(
        `Failed to fetch repository: ${fetchError?.message || fetchError}`, { cause: fetchError },
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
    await configureGitTransport(git);

    const sparseCheckoutPath = join(tempDir, '.git', 'info', 'sparse-checkout');
    const packagePath = `${source.packagesDir}/${packageName}/`;
    await fs.writeFile(sparseCheckoutPath, `${packagePath}\n`);

    try {
      await retry(() => git.fetch(['origin', '--depth=1']));
    } catch (fetchError: any) {
      throw new Error(
        `Failed to fetch repository: ${fetchError?.message || fetchError}`, { cause: fetchError },
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

export interface DownloadResult {
  name: string;
  success: boolean;
  error?: string;
}

// Batch download: group entries by source, single fetch per source
export async function downloadEntries(
  entries: PackageEntry[],
): Promise<DownloadResult[]> {
  // Group entries by source key (url + packagesDir)
  const groups = new Map<string, PackageEntry[]>();
  for (const entry of entries) {
    const key = `${entry.source.url}\0${entry.source.packagesDir}`;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const allResults: DownloadResult[] = [];

  const processGroup = async (group: PackageEntry[]): Promise<DownloadResult[]> => {
    const source = group[0].source;
    const tempDir = await createTempDir();
    const git = createGit(tempDir);

    try {
      await git.init();
      await git.addRemote('origin', source.url);
      await git.raw(['config', 'core.sparseCheckout', 'true']);
      await configureGitTransport(git);

      const sparseCheckoutPath = join(
        tempDir,
        '.git',
        'info',
        'sparse-checkout',
      );
      await fs.writeFile(sparseCheckoutPath, `${source.packagesDir}/\n`);

      try {
        await retry(() => git.fetch(['origin', '--depth=1']));
      } catch (fetchError: any) {
        return group.map(entry => ({
          name: entry.name,
          success: false,
          error: `Failed to fetch repository: ${fetchError?.message || fetchError}`,
        }));
      }

      await checkoutRemoteBranch(git);

      const { copyDirectory } = await import('./fs.js');
      return Promise.all(
        group.map(async entry => {
          try {
            const sourcePath = join(tempDir, source.packagesDir);
            await copyDirectory(sourcePath, entry.target);
            return { name: entry.name, success: true };
          } catch (error: any) {
            return {
              name: entry.name,
              success: false,
              error: error?.message || String(error),
            };
          }
        }),
      );
    } finally {
      await cleanupTempDir(tempDir);
    }
  };

  const groupResults = await Promise.all(
    [...groups.values()].map(group => processGroup(group)),
  );
  for (const results of groupResults) {
    allResults.push(...results);
  }

  return allResults;
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
