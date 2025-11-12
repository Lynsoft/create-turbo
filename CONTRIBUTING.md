# Contributing to @aiherrera/create-turbo

Thank you for your interest in contributing! 🎉

## Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/create-turbo.git
   cd create-turbo
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run tests** (automatically builds first):
   ```bash
   pnpm test
   ```

4. **Build manually** (optional):
   ```bash
   pnpm build
   ```

5. **Test locally**:
   ```bash
   pnpm link --global
   pnpm create @aiherrera/turbo test-app
   ```

## Commit Convention

This project uses **Conventional Commits** for automated releases. All commits must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `docs:` - Documentation changes (triggers patch version bump)
- `refactor:` - Code refactoring (triggers patch version bump)
- `perf:` - Performance improvements (triggers patch version bump)
- `test:` - Adding or updating tests (no release)
- `chore:` - Maintenance tasks (no release)
- `ci:` - CI/CD changes (no release)
- `build:` - Build system changes (no release)

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the commit footer:

```bash
git commit -m "feat: redesign CLI interface

BREAKING CHANGE: removed --template option, now uses fixed template"
```

This triggers a **major version bump** (1.0.0 → 2.0.0).

### Examples

```bash
# Feature (1.0.0 → 1.1.0)
git commit -m "feat: add support for Yarn Berry"

# Bug fix (1.0.0 → 1.0.1)
git commit -m "fix: resolve Windows path issues"

# Documentation (1.0.0 → 1.0.1)
git commit -m "docs: update installation instructions"

# No release
git commit -m "chore: update dependencies"
git commit -m "test: add integration tests"
```

## Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Make your changes** and commit using conventional commits

3. **Run tests**:
   ```bash
   pnpm test
   ```

4. **Push to your fork**:
   ```bash
   git push origin feat/my-new-feature
   ```

5. **Open a Pull Request** to the `main` branch

6. **Wait for CI checks** to pass

7. **Request review** from maintainers

## Automated Releases

When your PR is merged to `main`:

1. GitHub Actions runs tests and build
2. Semantic-release analyzes commits
3. Version is bumped automatically
4. CHANGELOG.md is updated
5. Package is published to npm with **provenance** (Trusted Publishing)
6. GitHub release is created

**You don't need to manually bump versions or publish!** 🚀

### npm Provenance

This project uses npm's **Trusted Publishing** feature, which:
- ✅ Eliminates the need for npm tokens
- ✅ Provides cryptographic proof of package origin
- ✅ Increases security and transparency
- ✅ Shows a verified badge on npm

## Questions?

Open an issue or reach out to [@aiherrera](https://github.com/aiherrera).

Thank you for contributing! 💙

