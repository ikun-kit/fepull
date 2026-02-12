import { promises as fs } from 'fs';

import { parse, stringify } from 'yaml';

import { FepullConfig } from '../types/config.js';

export const CONFIG_FILE = 'fepull.config.yml';

export async function configExists(): Promise<boolean> {
  try {
    await fs.access(CONFIG_FILE);
    return true;
  } catch {
    return false;
  }
}

export async function readConfig(): Promise<FepullConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return parse(content) as FepullConfig;
  } catch {
    return null;
  }
}

export async function writeConfig(config: FepullConfig): Promise<void> {
  const yamlContent = stringify(config, {
    indent: 2,
    lineWidth: 80,
    minContentWidth: 20,
  });
  await fs.writeFile(CONFIG_FILE, yamlContent);
}

export function getDefaultConfig(): FepullConfig {
  return {
    packages: [],
  };
}
