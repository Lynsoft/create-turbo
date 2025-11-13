import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import prompts from "prompts";
import validateNpmPackageName from "validate-npm-package-name";

// Template repository URL
export const TEMPLATE_REPO =
  "https://github.com/Lynsoft/turborepo-template.git";

// Add-ons configuration
export interface AddOn {
  name: string;
  repo: string;
  targetDir: string;
  description: string;
  configUpdates?: {
    turboJson?: (config: any) => any;
    biomeJson?: (config: any) => any;
  };
}

export const AVAILABLE_ADDONS: Record<string, AddOn> = {
  expo: {
    name: "Expo App",
    repo: "https://github.com/Lynsoft/turborepo-template-apps-expo.git",
    targetDir: "apps/mobile-expo",
    description: "React Native mobile app with Expo",
    configUpdates: {
      turboJson: (config: any) => {
        // Add Expo-specific outputs to build task
        if (!config.tasks) config.tasks = {};
        if (!config.tasks.build) config.tasks.build = {};
        if (!config.tasks.build.outputs) config.tasks.build.outputs = [];

        const expoOutputs = [
          "android/app/build/**",
          "ios/build/**",
          ".expo/**",
        ];

        // Add Expo outputs if they don't already exist
        for (const output of expoOutputs) {
          if (!config.tasks.build.outputs.includes(output)) {
            config.tasks.build.outputs.push(output);
          }
        }

        return config;
      },
      biomeJson: (config: any) => {
        // Add Expo-specific exclusions to files.includes
        if (!config.files) config.files = {};
        if (!config.files.includes) config.files.includes = [];

        const expoExclusions = [
          "!.expo",
          "!android",
          "!ios",
        ];

        // Add Expo exclusions if they don't already exist
        for (const exclusion of expoExclusions) {
          if (!config.files.includes.includes(exclusion)) {
            config.files.includes.push(exclusion);
          }
        }

        return config;
      },
    },
  },
};

export interface CliOptions {
  packageManager?: "pnpm" | "npm" | "yarn" | "bun";
  skipInstall?: boolean;
  skipGit?: boolean;
  withAddons?: string;
}

export interface CreateProjectOptions {
  projectName: string;
  packageManager: "pnpm" | "npm" | "yarn" | "bun";
  skipInstall: boolean;
  skipGit: boolean;
  addons: string[];
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
 * Prompt user for add-ons selection if not provided
 */
export async function getAddons(addonsOption?: string): Promise<string[]> {
  if (addonsOption) {
    // Parse comma-separated add-ons from CLI option
    return addonsOption.split(",").map((addon) => addon.trim());
  }

  const response = await prompts({
    type: "multiselect",
    name: "addons",
    message: "Select add-ons to include (optional):",
    choices: Object.entries(AVAILABLE_ADDONS).map(([key, addon]) => ({
      title: addon.name,
      description: addon.description,
      value: key,
      selected: false,
    })),
    hint: "Space to select, Enter to confirm",
  });

  return response.addons || [];
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
 * Update turbo.json configuration for installed add-ons
 */
export function updateTurboConfig(
  targetDir: string,
  addons: string[]
): void {
  if (addons.length === 0) {
    return;
  }

  const turboJsonPath = resolve(targetDir, "turbo.json");

  if (!existsSync(turboJsonPath)) {
    console.warn(pc.yellow("⚠ turbo.json not found, skipping configuration updates\n"));
    return;
  }

  try {
    // Read existing turbo.json
    const turboJsonContent = readFileSync(turboJsonPath, "utf-8");
    let turboConfig = JSON.parse(turboJsonContent);

    // Apply configuration updates from each add-on
    for (const addonKey of addons) {
      const addon = AVAILABLE_ADDONS[addonKey];
      if (addon?.configUpdates?.turboJson) {
        turboConfig = addon.configUpdates.turboJson(turboConfig);
      }
    }

    // Write updated turbo.json
    writeFileSync(turboJsonPath, JSON.stringify(turboConfig, null, 2) + "\n");
    console.log(pc.green("✓ Updated turbo.json configuration\n"));
  } catch (error) {
    console.error(pc.red("✖ Failed to update turbo.json:\n"));
    if (error instanceof Error) {
      console.error(pc.red(error.message));
    }
    throw error;
  }
}

/**
 * Update biome.json configuration for installed add-ons
 */
export function updateBiomeConfig(
  targetDir: string,
  addons: string[]
): void {
  if (addons.length === 0) {
    return;
  }

  const biomeJsonPath = resolve(targetDir, "biome.json");

  if (!existsSync(biomeJsonPath)) {
    console.warn(pc.yellow("⚠ biome.json not found, skipping configuration updates\n"));
    return;
  }

  try {
    // Read existing biome.json
    const biomeJsonContent = readFileSync(biomeJsonPath, "utf-8");
    let biomeConfig = JSON.parse(biomeJsonContent);

    // Apply configuration updates from each add-on
    for (const addonKey of addons) {
      const addon = AVAILABLE_ADDONS[addonKey];
      if (addon?.configUpdates?.biomeJson) {
        biomeConfig = addon.configUpdates.biomeJson(biomeConfig);
      }
    }

    // Write updated biome.json
    writeFileSync(biomeJsonPath, JSON.stringify(biomeConfig, null, 2) + "\n");
    console.log(pc.green("✓ Updated biome.json configuration\n"));
  } catch (error) {
    console.error(pc.red("✖ Failed to update biome.json:\n"));
    if (error instanceof Error) {
      console.error(pc.red(error.message));
    }
    throw error;
  }
}

/**
 * Install add-ons into the project
 */
export async function installAddons(
  targetDir: string,
  addons: string[]
): Promise<void> {
  if (addons.length === 0) {
    return;
  }

  console.log(pc.blue("\n🎨 Installing add-ons...\n"));

  for (const addonKey of addons) {
    const addon = AVAILABLE_ADDONS[addonKey];
    if (!addon) {
      console.warn(pc.yellow(`⚠ Unknown add-on: ${addonKey}, skipping...\n`));
      continue;
    }

    console.log(pc.blue(`📥 Installing ${addon.name}...\n`));

    const addonTargetDir = resolve(targetDir, addon.targetDir);

    try {
      // Clone add-on repository
      execSync(`git clone --depth 1 ${addon.repo} "${addonTargetDir}"`, {
        stdio: "inherit",
      });

      // Remove .git directory from add-on
      rmSync(resolve(addonTargetDir, ".git"), { recursive: true, force: true });

      console.log(pc.green(`✓ ${addon.name} installed at ${addon.targetDir}\n`));
    } catch (error) {
      console.error(pc.red(`✖ Failed to install ${addon.name}:\n`));
      if (error instanceof Error) {
        console.error(pc.red(error.message));
      }
      throw error;
    }
  }

  // Update configuration files for installed add-ons
  updateTurboConfig(targetDir, addons);
  updateBiomeConfig(targetDir, addons);

  console.log(pc.green("✓ All add-ons installed\n"));
}

/**
 * Create a new project from the template
 */
export async function createProject(
  options: CreateProjectOptions
): Promise<void> {
  const { projectName, packageManager, skipInstall, skipGit, addons } = options;
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

    // Install add-ons
    if (addons.length > 0) {
      await installAddons(targetDir, addons);
    }

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
    console.log(`     • Automated releases on push`);

    // Show installed add-ons
    if (addons.length > 0) {
      console.log(`  ${pc.bold("🎨 Add-ons Installed")}`);
      for (const addonKey of addons) {
        const addon = AVAILABLE_ADDONS[addonKey];
        if (addon) {
          console.log(`     • ${addon.name} - ${addon.targetDir}`);
        }
      }
    }

    console.log("\n");
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

  // Get add-ons
  const addons = await getAddons(options.withAddons);

  // Create the project
  await createProject({
    projectName,
    packageManager,
    skipInstall: options.skipInstall ?? false,
    skipGit: options.skipGit ?? false,
    addons,
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
    .option(
      "--with-addons <addons>",
      "Comma-separated list of add-ons to include (e.g., expo)"
    )
    .action(main);

  program.parse();
}
