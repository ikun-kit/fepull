export interface PackageSource {
  url: string;
  packagesDir: string;
}

export interface PackageEntry {
  name: string;
  source: PackageSource;
  target: string;
  description?: string;
}

export interface FepullConfig {
  packages: PackageEntry[];
}

export interface PackageInfo {
  name: string;
  path: string;
  description?: string;
}
