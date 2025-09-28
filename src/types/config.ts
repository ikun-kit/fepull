export interface Source {
  name: string;
  url: string;
  packagesDir: string;
  description?: string;
}

export interface Target {
  name: string;
  path: string;
  description?: string;
}

export interface FepullConfig {
  sources: Source[];
  targets: Target[];
}

export interface PackageInfo {
  name: string;
  path: string;
  description?: string;
}
