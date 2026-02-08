# fepull

A frontend package management tool for pulling packages from monorepo projects, similar to shadcn/ui.

## Features

- 🎯 Pull specific packages from monorepo projects
- ⚡ Efficient sparse-checkout for minimal bandwidth usage
- 🔄 Multi-select packages for batch installation
- 📊 Real-time installation progress with detailed summary
- 🔧 Interactive configuration setup
- 📦 Support for multiple package entries with bound source and target
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

   This creates a default `fepull.config.yml` file. Edit this file to configure your package entries.

2. **Install packages**:
   ```bash
   fepull install
   ```
   Interactive selection of package entry and packages to install.

## Configuration

The `fepull.config.yml` file structure:

```yaml
packages:
  - name: ikun-react
    source:
      url: https://github.com/ikun-kit/react
      packagesDir: packages
    target: ./src/components
    description: ikun-kit React component library
```

### Package Entry

- `name`: Identifier for this package entry
- `source`: Source repository configuration
  - `url`: Git repository URL
  - `packagesDir`: Directory containing packages in the repository
- `target`: Local path where packages will be installed
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

1. **Entry Selection**: Choose from configured package entries (source and target are bound together)
2. **Package Discovery**: Uses Git sparse-checkout to efficiently fetch only the packages directory listing
3. **Package Selection**: Interactive multi-selection from available packages (use space to select, enter to confirm)
4. **Installation**: Uses sparse-checkout to download only the selected packages and copies them to the target directory

## Example Workflow

```bash
# Initialize project
fepull init
# → Creates fepull.config.yml
# → Edit it to configure your package entries (source + target)

# Install multiple components
fepull install
# → Select "ikun-react" entry
# → Multi-select packages: "button", "input", "dialog" (use space to select)
# → Packages are installed to the configured target directory
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
