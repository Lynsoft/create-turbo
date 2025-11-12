import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TEMPLATE_REPO,
  createProject,
  getPackageManager,
  getProjectName,
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
        })
      ).rejects.toThrow("Process exited with code 1");

      mockExit.mockRestore();
    });
  });
});

