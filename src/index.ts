import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import prompts from "prompts";
import validateNpmPackageName from "validate-npm-package-name";

// Template repository URL
export const TEMPLATE_REPO =
  "https://github.com/Lynsoft/turborepo-template.git";

export interface CliOptions {
  packageManager?: "pnpm" | "npm" | "yarn" | "bun";
  skipInstall?: boolean;
  skipGit?: boolean;
}

export interface CreateProjectOptions {
  projectName: string;
  packageManager: "pnpm" | "npm" | "yarn" | "bun";
  skipInstall: boolean;
  skipGit: boolean;
}

/**
 * Prompt user for project name if not provided
 */
export async function getProjectName(
  projectNameArg?: string
): Promise<string> {
  if (projectNameArg) {
    return projectNameArg;
  }

  const response = await prompts({
    type: "text",
    name: "projectName",
    message: "What is your project named?",
    initial: "my-turborepo-app",
    validate: (value) => {
      const validation = validateNpmPackageName(value);
      if (!validation.validForNewPackages) {
        return validation.errors?.[0] || "Invalid package name";
      }
      return true;
    },
  });

  if (!response.projectName) {
    console.log(pc.red("\n✖ Project creation cancelled\n"));
    process.exit(1);
  }

  return response.projectName;
}

/**
 * Validate project name using npm package name rules
 */
export function validateProjectName(projectName: string): void {
  const validation = validateNpmPackageName(projectName);
  if (!validation.validForNewPackages) {
    console.error(
      pc.red(`\n✖ Invalid project name: ${validation.errors?.[0]}\n`)
    );
    process.exit(1);
  }
}

/**
 * Prompt user for package manager if not provided
 */
export async function getPackageManager(
  packageManagerOption?: string
): Promise<"pnpm" | "npm" | "yarn" | "bun"> {
  if (packageManagerOption) {
    return packageManagerOption as "pnpm" | "npm" | "yarn" | "bun";
  }

  const response = await prompts({
    type: "select",
    name: "packageManager",
    message: "Which package manager would you like to use?",
    choices: [
      { title: "pnpm (recommended)", value: "pnpm" },
      { title: "npm", value: "npm" },
      { title: "yarn", value: "yarn" },
      { title: "bun", value: "bun" },
    ],
    initial: 0,
  });

  if (!response.packageManager) {
    console.log(pc.red("\n✖ Project creation cancelled\n"));
    process.exit(1);
  }

  return response.packageManager;
}

/**
 * Create a new project from the template
 */
export async function createProject(
  options: CreateProjectOptions
): Promise<void> {
  const { projectName, packageManager, skipInstall, skipGit } = options;
  const targetDir = resolve(process.cwd(), projectName);

  // Check if directory exists
  if (existsSync(targetDir)) {
    console.error(pc.red(`\n✖ Directory ${projectName} already exists\n`));
    process.exit(1);
  }

  console.log(pc.blue(`\n📦 Creating project in ${pc.bold(targetDir)}...\n`));

  try {
    // Clone template repository
    console.log(pc.blue("📥 Downloading template...\n"));
    execSync(`git clone --depth 1 ${TEMPLATE_REPO} "${targetDir}"`, {
      stdio: "inherit",
    });

    // Remove .git directory
    rmSync(resolve(targetDir, ".git"), { recursive: true, force: true });

    console.log(pc.green("✓ Template downloaded\n"));

    // Install dependencies
    if (!skipInstall) {
      console.log(
        pc.blue(`📦 Installing dependencies with ${packageManager}...\n`)
      );
      execSync(`${packageManager} install`, {
        cwd: targetDir,
        stdio: "inherit",
      });
      console.log(pc.green("\n✓ Dependencies installed\n"));
    }

    // Initialize git
    if (!skipGit) {
      console.log(pc.blue("🔧 Initializing git repository...\n"));
      execSync("git init", { cwd: targetDir, stdio: "inherit" });
      console.log(pc.green("✓ Git initialized\n"));
    }

    // Success message with feature showcase
    console.log(
      pc.green(`\n✨ Success! Created ${projectName} at ${targetDir}\n`)
    );

    console.log(pc.cyan("📦 What you got:\n"));
    console.log(`  ${pc.bold("🚀 Modern Stack")}`);
    console.log(`     • TypeScript, React, Tailwind CSS`);
    console.log(`  ${pc.bold("⚡ Fast Tooling")}`);
    console.log(`     • Biome (linting + formatting)`);
    console.log(`     • Turborepo (build orchestration)`);
    console.log(`  ${pc.bold("🔧 Developer Experience")}`);
    console.log(`     • Lefthook git hooks`);
    console.log(`     • Conventional commits enforced`);
    console.log(`     • Semantic-release automation`);
    console.log(`  ${pc.bold("🐳 Docker Ready")}`);
    console.log(`     • PostgreSQL + Redis included`);
    console.log(`     • Multi-stage builds (dev + prod)`);
    console.log(`  ${pc.bold("📦 Shared Packages")}`);
    console.log(`     • @repo/ui - React components`);
    console.log(`     • @repo/typescript-config - TS configs`);
    console.log(`  ${pc.bold("🤖 CI/CD")}`);
    console.log(`     • GitHub Actions configured`);
    console.log(`     • Automated releases on push\n`);

    console.log(pc.cyan("🎯 Get started:\n"));
    console.log(`  ${pc.bold(`cd ${projectName}`)}`);
    if (skipInstall) {
      console.log(`  ${pc.bold(`${packageManager} install`)}`);
    }
    console.log(`  ${pc.bold(`${packageManager} hooks:install`)} - Set up git hooks`);
    console.log(`  ${pc.bold(`${packageManager} dev`)} - Start development\n`);
  } catch (error) {
    console.error(pc.red("\n✖ Error creating project:\n"));
    if (error instanceof Error) {
      console.error(pc.red(error.message));
      if (error.stack) {
        console.error(pc.dim("\nStack trace:"));
        console.error(pc.dim(error.stack));
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Main CLI function
 */
export async function main(
  projectNameArg?: string,
  options: CliOptions = {}
): Promise<void> {
  console.log(pc.cyan("\n🚀 Create Turborepo Template\n"));

  // Get and validate project name
  const projectName = await getProjectName(projectNameArg);
  validateProjectName(projectName);

  // Get package manager
  const packageManager = await getPackageManager(options.packageManager);

  // Create the project
  await createProject({
    projectName,
    packageManager,
    skipInstall: options.skipInstall ?? false,
    skipGit: options.skipGit ?? false,
  });
}

// CLI setup - only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const program = new Command();

  program
    .name("create-turborepo-template")
    .description("Create a new project using the Turborepo template")
    .version("1.0.0")
    .argument("[project-name]", "Name of the project")
    .option(
      "-p, --package-manager <manager>",
      "Package manager to use (pnpm, npm, yarn, bun)"
    )
    .option("--skip-install", "Skip installing dependencies")
    .option("--skip-git", "Skip git initialization")
    .action(main);

  program.parse();
}
