# @aiherrera/create-turbo

[![npm version](https://badge.fury.io/js/@aiherrera%2Fcreate-turbo.svg)](https://www.npmjs.com/package/@aiherrera/create-turbo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD](https://github.com/Lynsoft/create-turbo/actions/workflows/publish.yml/badge.svg)](https://github.com/Lynsoft/create-turbo/actions/workflows/publish.yml)
[![npm provenance](https://img.shields.io/badge/npm-provenance-blue)](https://docs.npmjs.com/generating-provenance-statements)
[![Node.js Version](https://img.shields.io/node/v/@aiherrera/create-turbo)](https://nodejs.org)

CLI to scaffold production-ready Turborepo monorepos with TypeScript, React, Tailwind CSS, Biome, Lefthook, Docker (PostgreSQL + Redis), and automated CI/CD.

## Quick Start

### With pnpm (recommended)

```bash
pnpm create @aiherrera/turbo my-app
cd my-app
pnpm dev
```

### With npm

```bash
npm create @aiherrera/turbo my-app
cd my-app
npm run dev
```

### With yarn

```bash
yarn create @aiherrera/turbo my-app
cd my-app
yarn dev
```

### With bun

```bash
bun create @aiherrera/turbo my-app
cd my-app
bun dev
```

### Alternative: Using npx/pnpx

```bash
pnpx @aiherrera/create-turbo my-app
# or
npx @aiherrera/create-turbo my-app
```

## CLI Options

```bash
pnpm create @aiherrera/turbo [project-name] [options]
```

### Arguments

- `[project-name]` - Name of your project (optional, will prompt if not provided)

### Options

- `-p, --package-manager <manager>` - Package manager to use (pnpm, npm, yarn, bun)
- `--skip-install` - Skip installing dependencies
- `--skip-git` - Skip git initialization
- `--with-addons <addons>` - Comma-separated list of add-ons to include (e.g., expo)
- `-h, --help` - Display help
- `-V, --version` - Display version

## Examples

```bash
# Interactive mode (prompts for project name, package manager, and add-ons)
pnpm create @aiherrera/turbo

# With project name
pnpm create @aiherrera/turbo my-awesome-app

# With specific package manager
pnpm create @aiherrera/turbo my-app -p npm

# With add-ons (Expo mobile app)
pnpm create @aiherrera/turbo my-app --with-addons expo

# Skip dependency installation (useful for CI/CD)
pnpm create @aiherrera/turbo my-app --skip-install

# Skip git initialization
pnpm create @aiherrera/turbo my-app --skip-git

# Combine options
pnpm create @aiherrera/turbo my-app -p yarn --with-addons expo --skip-git
```

## What You Get

This CLI scaffolds a production-ready Turborepo monorepo with:

### 🚀 Modern Stack
- **TypeScript** - Type-safe development
- **React** - UI library
- **Tailwind CSS** - Utility-first styling

### ⚡ Fast Tooling
- **Biome** - Lightning-fast linting and formatting
- **Turborepo** - High-performance build orchestration
- **pnpm** - Efficient package management

### 🔧 Developer Experience
- **Lefthook** - Fast git hooks
- **Conventional Commits** - Enforced commit standards
- **Semantic Release** - Automated versioning and releases

### 🐳 Docker Ready
- **PostgreSQL + Redis** - Pre-configured databases
- **Multi-stage builds** - Optimized for dev and production

### 📦 Shared Packages
- **@repo/ui** - Shared React components
- **@repo/typescript-config** - Shared TypeScript configurations

### 🤖 CI/CD
- **GitHub Actions** - Pre-configured workflows
- **Automated releases** - On every push to main

## Add-ons

Enhance your monorepo with optional add-ons during setup or by using the `--with-addons` flag:

### Available Add-ons

#### 📱 Expo App (`expo`)
- **Repository**: [Lynsoft/turborepo-template-apps-expo](https://github.com/Lynsoft/turborepo-template-apps-expo)
- **Location**: `apps/mobile-expo`
- **Description**: React Native mobile app with Expo, fully integrated with your monorepo
- **Features**:
  - Pre-configured Expo app with Sentry, NativeWind, and file-based routing
  - Shared UI components from `@repo/ui`
  - TypeScript support
  - Ready for iOS and Android development
- **Automatic Configuration**: The CLI automatically updates:
  - `turbo.json`: Adds Expo-specific build outputs (`android/app/build/**`, `ios/build/**`, `.expo/**`)
  - `biome.json`: Adds Expo directory exclusions (`!.expo`, `!android`, `!ios`)

### Using Add-ons

```bash
# Interactive selection (prompts during setup)
pnpm create @aiherrera/turbo my-app

# Via CLI flag
pnpm create @aiherrera/turbo my-app --with-addons expo

# Multiple add-ons (when more become available)
pnpm create @aiherrera/turbo my-app --with-addons expo,other
```

## Template Repository

This CLI clones from: [Lynsoft/turborepo-template](https://github.com/Lynsoft/turborepo-template)

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/Lynsoft/create-turbo.git
cd create-turbo

# Install dependencies
pnpm install

# Run tests (automatically builds first)
pnpm test

# Or build manually
pnpm build

# Test locally
pnpm link --global
pnpm create @aiherrera/turbo test-app
```

### Automated Releases

This project uses **semantic-release** for automated versioning and publishing to npm.

#### How it works:

1. **Commit with conventional commits** (required):
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update README"
   ```

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **Automated release** (GitHub Actions):
   - Analyzes commits since last release
   - Determines version bump (major/minor/patch)
   - Generates CHANGELOG.md
   - Creates GitHub release
   - Publishes to npm
   - Commits version bump back to repo

#### Commit Types:

- `feat:` → Minor version bump (1.0.0 → 1.1.0)
- `fix:` → Patch version bump (1.0.0 → 1.0.1)
- `perf:` → Patch version bump
- `docs:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump (1.0.0 → 2.0.0)
- `chore:`, `test:`, `ci:` → No release

#### Setup Requirements:

This project uses **npm Trusted Publishing** (provenance) for secure, token-free publishing.

##### Option 1: Trusted Publishing (Recommended - No tokens needed!)

1. **Configure npm Trusted Publishing**:
   - Go to [npmjs.com](https://www.npmjs.com/) → Account Settings → Publishing Access
   - Click "Configure Trusted Publishing"
   - Add GitHub as a provider:
     - **Repository**: `Lynsoft/create-turbo`
     - **Workflow**: `publish.yml`
     - **Environment**: (leave empty)
   - Save configuration

2. **GITHUB_TOKEN**: Automatically provided by GitHub Actions (no setup needed)

##### Option 2: Manual npm Token (Legacy - Not recommended)

If you can't use Trusted Publishing:

1. **NPM_TOKEN**: Your npm access token
   - Go to [npmjs.com](https://www.npmjs.com/) → Access Tokens → Generate New Token
   - Select "Automation" type
   - Add to GitHub: Settings → Secrets → New repository secret → `NPM_TOKEN`

**Note**: Trusted Publishing is more secure and doesn't require managing tokens!

## License

MIT © [Alain Iglesias](https://github.com/aiherrera)

