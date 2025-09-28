# fepull

A frontend package management tool for pulling packages from monorepo projects, similar to shadcn/ui.

## Features

- 🎯 Pull specific packages from monorepo projects
- ⚡ Efficient sparse-checkout for minimal bandwidth usage
- 🔄 Multi-select packages for batch installation
- 📊 Real-time installation progress with detailed summary
- 🔧 Interactive configuration setup
- 📦 Support for multiple source repositories
- 🎨 Multiple target directories
- 🚀 Works with npx, global installation, or local project installation

## Installation

### Using npx (Recommended)

```bash
npx @ikun-kit/fepull init
npx @ikun-kit/fepull install
```

### Global Installation

```bash
pnpm add -g @ikun-kit/fepull
fepull init
fepull install
```

### Project Installation

```bash
pnpm add -D @ikun-kit/fepull
pnpm fepull init
pnpm fepull install
```

## Quick Start

1. **Initialize configuration**:

   ```bash
   fepull init
   ```

   This creates a default `fepull.config.yml` file. Edit this file to configure your source repositories and target directories.

2. **Install packages**:
   ```bash
   fepull install
   ```
   Interactive selection of source, package, and target directory.

## Configuration

The `fepull.config.yml` file structure:

```yaml
sources:
  - name: ikun-react
    url: https://github.com/ikun-kit/react
    packagesDir: packages
    description: ikun-kit React component library

targets:
  - name: components
    path: ./src/components
    description: Project components directory
```

### Sources

- `name`: Identifier for the source repository
- `url`: Git repository URL
- `packagesDir`: Directory containing packages in the repository
- `description`: Optional description

### Targets

- `name`: Identifier for the target directory
- `path`: Local path where packages will be installed
- `description`: Optional description

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm

### Setup

```bash
# Clone repository
git clone <repository-url>
cd fepull

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm dev
```

### Scripts

- `pnpm build` - Build the TypeScript project
- `pnpm dev` - Build in watch mode
- `pnpm start` - Run the CLI directly

## How It Works

1. **Source Selection**: Choose from configured source repositories
2. **Package Discovery**: Uses Git sparse-checkout to efficiently fetch only the packages directory listing
3. **Package Selection**: Interactive multi-selection from available packages (use space to select, enter to confirm)
4. **Target Selection**: Choose destination directory from configured targets
5. **Installation**: Uses sparse-checkout to download only the selected packages and copies them to the target directory

## Example Workflow

```bash
# Initialize project
fepull init
# → Configure ikun-kit/react as source
# → Configure ./src/components as target
# → Creates fepull.config.yml

# Install multiple components
fepull install
# → Select "ikun-react" source
# → Multi-select packages: "button", "input", "dialog" (use space to select)
# → Select "components" target
# → Installing 3 package(s)...
# → ✅ button installed successfully
# → ✅ input installed successfully
# → ✅ dialog installed successfully
# → 📋 Installation Summary: ✅ 3 package(s) installed successfully
```

## Requirements

- Git must be installed and accessible
- Internet connection for downloading source repositories
- Write permissions for target directories

## License

MIT
