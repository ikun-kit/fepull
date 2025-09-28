import { promises as fs } from 'fs';
import { join, relative } from 'path';

export async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function ensureDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

export function getRelativePath(from: string, to: string): string {
  return relative(from, to);
}
