import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AVAILABLE_ADDONS,
  TEMPLATE_REPO,
  createProject,
  getAddons,
  getPackageManager,
  getProjectName,
  installAddons,
  updateBiomeConfig,
  updateTurboConfig,
  validateProjectName,
} from "./index";

// Mock modules
vi.mock("node:child_process");
vi.mock("node:fs");
vi.mock("prompts");

describe("CLI Unit Tests - Refactored Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("TEMPLATE_REPO constant", () => {
    it("should have the correct template repository URL", () => {
      expect(TEMPLATE_REPO).toBe(
        "https://github.com/Lynsoft/turborepo-template.git"
      );
    });
  });

  describe("getProjectName", () => {
    it("should return the provided project name without prompting", async () => {
      const projectName = await getProjectName("my-test-project");
      expect(projectName).toBe("my-test-project");
    });

    it("should prompt for project name when not provided", async () => {
      const prompts = (await import("prompts")).default;
      vi.mocked(prompts).mockResolvedValue({ projectName: "prompted-project" });

      const projectName = await getProjectName();
      expect(projectName).toBe("prompted-project");
      expect(prompts).toHaveBeenCalled();
    });

    it("should exit when user cancels the prompt", async () => {
      const prompts = (await import("prompts")).default;
      vi.mocked(prompts).mockResolvedValue({});

      const mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(getProjectName()).rejects.toThrow("Process exited with code 1");
      mockExit.mockRestore();
    });
  });

  describe("validateProjectName", () => {
    it("should not throw for valid project names", () => {
      expect(() => validateProjectName("my-project")).not.toThrow();
      expect(() => validateProjectName("my-awesome-app")).not.toThrow();
      expect(() => validateProjectName("@scope/package")).not.toThrow();
    });

    it("should exit for invalid project names", () => {
      const mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });

      expect(() => validateProjectName("Invalid Name")).toThrow("Process exited with code 1");
      expect(() => validateProjectName(".invalid")).toThrow("Process exited with code 1");

      mockExit.mockRestore();
    });
  });

  describe("getPackageManager", () => {
    it("should return the provided package manager without prompting", async () => {
      const pm = await getPackageManager("pnpm");
      expect(pm).toBe("pnpm");
    });

    it("should prompt for package manager when not provided", async () => {
      const prompts = (await import("prompts")).default;
      vi.mocked(prompts).mockResolvedValue({ packageManager: "npm" });

      const pm = await getPackageManager();
      expect(pm).toBe("npm");
      expect(prompts).toHaveBeenCalled();
    });

    it("should exit when user cancels the prompt", async () => {
      const prompts = (await import("prompts")).default;
      vi.mocked(prompts).mockResolvedValue({});

      const mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(getPackageManager()).rejects.toThrow("Process exited with code 1");
      mockExit.mockRestore();
    });
  });

  describe("createProject", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
      vi.mocked(rmSync).mockImplementation(() => {});
    });

    it("should check if directory exists", async () => {
      await createProject({
        projectName: "test-app",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: true,
        addons: [],
      });

      expect(existsSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test-app")
      );
    });

    it("should exit if directory already exists", async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(
        createProject({
          projectName: "existing-app",
          packageManager: "pnpm",
          skipInstall: true,
          skipGit: true,
          addons: [],
        })
      ).rejects.toThrow("Process exited with code 1");

      mockExit.mockRestore();
    });

    it("should clone the template repository", async () => {
      const targetDir = resolve(process.cwd(), "test-app");

      await createProject({
        projectName: "test-app",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: true,
        addons: [],
      });

      expect(execSync).toHaveBeenCalledWith(
        `git clone --depth 1 ${TEMPLATE_REPO} "${targetDir}"`,
        { stdio: "inherit" }
      );
    });

    it("should remove .git directory after cloning", async () => {
      const targetDir = resolve(process.cwd(), "test-app");
      const gitDir = resolve(targetDir, ".git");

      await createProject({
        projectName: "test-app",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: true,
        addons: [],
      });

      expect(rmSync).toHaveBeenCalledWith(gitDir, {
        recursive: true,
        force: true,
      });
    });

    it("should install dependencies when skipInstall is false", async () => {
      const targetDir = resolve(process.cwd(), "test-app");

      await createProject({
        projectName: "test-app",
        packageManager: "pnpm",
        skipInstall: false,
        skipGit: true,
        addons: [],
      });

      expect(execSync).toHaveBeenCalledWith("pnpm install", {
        cwd: targetDir,
        stdio: "inherit",
      });
    });

    it("should NOT install dependencies when skipInstall is true", async () => {
      await createProject({
        projectName: "test-app",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: true,
        addons: [],
      });

      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("install"),
        expect.anything()
      );
    });

    it("should initialize git when skipGit is false", async () => {
      const targetDir = resolve(process.cwd(), "test-app");

      await createProject({
        projectName: "test-app",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: false,
        addons: [],
      });

      expect(execSync).toHaveBeenCalledWith("git init", {
        cwd: targetDir,
        stdio: "inherit",
      });
    });

    it("should NOT initialize git when skipGit is true", async () => {
      await createProject({
        projectName: "test-app",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: true,
        addons: [],
      });

      const gitInitCalls = vi.mocked(execSync).mock.calls.filter(
        (call) => call[0] === "git init"
      );
      expect(gitInitCalls).toHaveLength(0);
    });

    it("should work with different package managers", async () => {
      const packageManagers = ["pnpm", "npm", "yarn", "bun"] as const;

      for (const pm of packageManagers) {
        vi.clearAllMocks();
        const targetDir = resolve(process.cwd(), "test-app");

        await createProject({
          projectName: "test-app",
          packageManager: pm,
          skipInstall: false,
          skipGit: true,
          addons: [],
        });

        expect(execSync).toHaveBeenCalledWith(`${pm} install`, {
          cwd: targetDir,
          stdio: "inherit",
        });
      }
    });

    it("should exit on error during project creation", async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Git clone failed");
      });

      const mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(
        createProject({
          projectName: "test-app",
          packageManager: "pnpm",
          skipInstall: true,
          skipGit: true,
          addons: [],
        })
      ).rejects.toThrow("Process exited with code 1");

      mockExit.mockRestore();
    });
  });

  describe("AVAILABLE_ADDONS constant", () => {
    it("should have expo add-on configured", () => {
      expect(AVAILABLE_ADDONS.expo).toBeDefined();
      expect(AVAILABLE_ADDONS.expo.name).toBe("Expo App");
      expect(AVAILABLE_ADDONS.expo.repo).toBe(
        "https://github.com/Lynsoft/turborepo-template-apps-expo.git"
      );
      expect(AVAILABLE_ADDONS.expo.targetDir).toBe("apps/mobile-expo");
    });
  });

  describe("getAddons", () => {
    it("should return parsed add-ons from CLI option", async () => {
      const addons = await getAddons("expo");
      expect(addons).toEqual(["expo"]);
    });

    it("should parse comma-separated add-ons", async () => {
      const addons = await getAddons("expo,other");
      expect(addons).toEqual(["expo", "other"]);
    });

    it("should trim whitespace from add-on names", async () => {
      const addons = await getAddons("expo , other ");
      expect(addons).toEqual(["expo", "other"]);
    });

    it("should prompt for add-ons when not provided", async () => {
      const prompts = (await import("prompts")).default;
      vi.mocked(prompts).mockResolvedValue({ addons: ["expo"] });

      const addons = await getAddons();
      expect(addons).toEqual(["expo"]);
      expect(prompts).toHaveBeenCalled();
    });

    it("should return empty array when user selects no add-ons", async () => {
      const prompts = (await import("prompts")).default;
      vi.mocked(prompts).mockResolvedValue({ addons: [] });

      const addons = await getAddons();
      expect(addons).toEqual([]);
    });
  });

  describe("installAddons", () => {
    beforeEach(() => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
      vi.mocked(rmSync).mockImplementation(() => {});
    });

    it("should skip installation when no add-ons provided", async () => {
      vi.clearAllMocks();
      await installAddons("/test/dir", []);
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should clone add-on repository to correct location", async () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(false);

      await installAddons("/test/dir", ["expo"]);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(
          "git clone --depth 1 https://github.com/Lynsoft/turborepo-template-apps-expo.git"
        ),
        expect.any(Object)
      );
    });

    it("should remove .git directory from add-on", async () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(false);

      await installAddons("/test/dir", ["expo"]);

      expect(rmSync).toHaveBeenCalledWith(
        expect.stringContaining("apps/mobile-expo/.git"),
        expect.any(Object)
      );
    });

    it("should warn about unknown add-ons", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await installAddons("/test/dir", ["unknown-addon"]);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("should throw error when git clone fails", async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Git clone failed");
      });

      await expect(installAddons("/test/dir", ["expo"])).rejects.toThrow(
        "Git clone failed"
      );
    });
  });

  describe("updateTurboConfig", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          tasks: {
            build: {
              outputs: [".next/**", "!.next/cache/**", "dist/**"],
            },
          },
        })
      );
      vi.mocked(writeFileSync).mockImplementation(() => {});
    });

    it("should skip update when no add-ons provided", () => {
      vi.clearAllMocks();
      updateTurboConfig("/test/dir", []);
      expect(readFileSync).not.toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it("should skip update when turbo.json does not exist", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(false);
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      updateTurboConfig("/test/dir", ["expo"]);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(readFileSync).not.toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("should add Expo outputs to turbo.json", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          tasks: {
            build: {
              outputs: [".next/**", "!.next/cache/**", "dist/**"],
            },
          },
        })
      );

      updateTurboConfig("/test/dir", ["expo"]);

      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("turbo.json"),
        expect.stringContaining("android/app/build/**")
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("turbo.json"),
        expect.stringContaining("ios/build/**")
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("turbo.json"),
        expect.stringContaining(".expo/**")
      );
    });

    it("should not duplicate Expo outputs if already present", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          tasks: {
            build: {
              outputs: [
                ".next/**",
                "!.next/cache/**",
                "dist/**",
                "android/app/build/**",
                "ios/build/**",
                ".expo/**",
              ],
            },
          },
        })
      );

      updateTurboConfig("/test/dir", ["expo"]);

      const writtenContent = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);

      // Count occurrences of each Expo output
      const outputs = config.tasks.build.outputs;
      const androidCount = outputs.filter((o: string) => o === "android/app/build/**").length;
      const iosCount = outputs.filter((o: string) => o === "ios/build/**").length;
      const expoCount = outputs.filter((o: string) => o === ".expo/**").length;

      expect(androidCount).toBe(1);
      expect(iosCount).toBe(1);
      expect(expoCount).toBe(1);
    });

    it("should handle turbo.json without tasks", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));

      updateTurboConfig("/test/dir", ["expo"]);

      const writtenContent = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);

      expect(config.tasks).toBeDefined();
      expect(config.tasks.build).toBeDefined();
      expect(config.tasks.build.outputs).toContain("android/app/build/**");
      expect(config.tasks.build.outputs).toContain("ios/build/**");
      expect(config.tasks.build.outputs).toContain(".expo/**");
    });

    it("should throw error when JSON parsing fails", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("invalid json");

      expect(() => updateTurboConfig("/test/dir", ["expo"])).toThrow();
    });
  });

  describe("updateBiomeConfig", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          files: {
            includes: [
              "apps/**/*.{js,jsx,ts,tsx,json,jsonc}",
              "packages/**/*.{js,jsx,ts,tsx,json,jsonc}",
              "*.{js,jsx,ts,tsx,json,jsonc}",
            ],
          },
        })
      );
      vi.mocked(writeFileSync).mockImplementation(() => {});
    });

    it("should skip update when no add-ons provided", () => {
      vi.clearAllMocks();
      updateBiomeConfig("/test/dir", []);
      expect(readFileSync).not.toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it("should skip update when biome.json does not exist", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(false);
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      updateBiomeConfig("/test/dir", ["expo"]);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(readFileSync).not.toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("should add Expo exclusions to biome.json files.includes", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          files: {
            includes: [
              "apps/**/*.{js,jsx,ts,tsx,json,jsonc}",
              "packages/**/*.{js,jsx,ts,tsx,json,jsonc}",
              "*.{js,jsx,ts,tsx,json,jsonc}",
            ],
          },
        })
      );

      updateBiomeConfig("/test/dir", ["expo"]);

      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("biome.json"),
        expect.stringContaining("!.expo")
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("biome.json"),
        expect.stringContaining("!android")
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("biome.json"),
        expect.stringContaining("!ios")
      );
    });

    it("should not duplicate Expo exclusions if already present", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          files: {
            includes: [
              "apps/**/*.{js,jsx,ts,tsx,json,jsonc}",
              "packages/**/*.{js,jsx,ts,tsx,json,jsonc}",
              "*.{js,jsx,ts,tsx,json,jsonc}",
              "!.expo",
              "!android",
              "!ios",
            ],
          },
        })
      );

      updateBiomeConfig("/test/dir", ["expo"]);

      const writtenContent = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);

      // Count occurrences of each Expo exclusion
      const includes = config.files.includes;
      const expoCount = includes.filter((i: string) => i === "!.expo").length;
      const androidCount = includes.filter((i: string) => i === "!android").length;
      const iosCount = includes.filter((i: string) => i === "!ios").length;

      expect(expoCount).toBe(1);
      expect(androidCount).toBe(1);
      expect(iosCount).toBe(1);
    });

    it("should handle biome.json without files.includes", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));

      updateBiomeConfig("/test/dir", ["expo"]);

      const writtenContent = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      const config = JSON.parse(writtenContent);

      expect(config.files).toBeDefined();
      expect(config.files.includes).toBeDefined();
      expect(config.files.includes).toContain("!.expo");
      expect(config.files.includes).toContain("!android");
      expect(config.files.includes).toContain("!ios");
    });

    it("should throw error when JSON parsing fails", () => {
      vi.clearAllMocks();
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("invalid json");

      expect(() => updateBiomeConfig("/test/dir", ["expo"])).toThrow();
    });
  });

  describe("createProject with add-ons", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
      vi.mocked(rmSync).mockImplementation(() => {});
    });

    it("should install add-ons when provided", async () => {
      await createProject({
        projectName: "test-project",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: true,
        addons: ["expo"],
      });

      // Should clone main template
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(TEMPLATE_REPO),
        expect.any(Object)
      );

      // Should clone add-on
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(AVAILABLE_ADDONS.expo.repo),
        expect.any(Object)
      );
    });

    it("should not install add-ons when empty array provided", async () => {
      await createProject({
        projectName: "test-project",
        packageManager: "pnpm",
        skipInstall: true,
        skipGit: true,
        addons: [],
      });

      // Should only clone main template
      expect(execSync).toHaveBeenCalledTimes(1);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(TEMPLATE_REPO),
        expect.any(Object)
      );
    });
  });
});

