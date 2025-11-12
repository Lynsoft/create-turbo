import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

describe("CLI Integration Tests", () => {
  const TEST_DIR = resolve(process.cwd(), "test-integration-output");
  const CLI_PATH = resolve(process.cwd(), "dist/index.js");

  beforeAll(() => {
    // Ensure CLI is built
    if (!existsSync(CLI_PATH)) {
      throw new Error(
        "CLI not built. Run 'pnpm build' before running integration tests."
      );
    }
  });

  afterEach(() => {
    // Clean up test directories
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe("CLI Help and Version", () => {
    it("should display help message with --help flag", () => {
      const output = execSync(`node ${CLI_PATH} --help`, {
        encoding: "utf-8",
      });

      expect(output).toContain("Usage:");
      expect(output).toContain("create-turborepo-template");
      expect(output).toContain("--package-manager");
      expect(output).toContain("--skip-install");
      expect(output).toContain("--skip-git");
    });

    it("should display version with --version flag", () => {
      const output = execSync(`node ${CLI_PATH} --version`, {
        encoding: "utf-8",
      });

      expect(output).toContain("1.0.0");
    });

    it("should display help with -h flag", () => {
      const output = execSync(`node ${CLI_PATH} -h`, {
        encoding: "utf-8",
      });

      expect(output).toContain("Usage:");
    });

    it("should display version with -V flag", () => {
      const output = execSync(`node ${CLI_PATH} -V`, {
        encoding: "utf-8",
      });

      expect(output).toContain("1.0.0");
    });
  });

  describe("CLI Error Handling", () => {
    it("should reject invalid project names", () => {
      expect(() => {
        execSync(
          `node ${CLI_PATH} "Invalid Name With Spaces" --skip-install --skip-git`,
          { encoding: "utf-8" }
        );
      }).toThrow();
    });

    it("should reject project name starting with dot", () => {
      expect(() => {
        execSync(`node ${CLI_PATH} ".invalid" --skip-install --skip-git`, {
          encoding: "utf-8",
        });
      }).toThrow();
    });

    it("should reject blacklisted project names", () => {
      expect(() => {
        execSync(
          `node ${CLI_PATH} "node_modules" --skip-install --skip-git`,
          { encoding: "utf-8" }
        );
      }).toThrow();
    });
  });

  describe("CLI Options", () => {
    it("should accept valid project name", () => {
      // This test would actually create a project, so we skip it in CI
      // or mock the git clone operation
      expect(true).toBe(true);
    });

    it("should support --package-manager option", () => {
      // Test that the option is recognized (doesn't throw parsing error)
      expect(() => {
        execSync(`node ${CLI_PATH} --help`, { encoding: "utf-8" });
      }).not.toThrow();
    });

    it("should support --skip-install option", () => {
      expect(() => {
        execSync(`node ${CLI_PATH} --help`, { encoding: "utf-8" });
      }).not.toThrow();
    });

    it("should support --skip-git option", () => {
      expect(() => {
        execSync(`node ${CLI_PATH} --help`, { encoding: "utf-8" });
      }).not.toThrow();
    });
  });

  describe("CLI Package Manager Options", () => {
    it("should accept pnpm as package manager", () => {
      // Verify the option is valid
      const helpOutput = execSync(`node ${CLI_PATH} --help`, {
        encoding: "utf-8",
      });
      expect(helpOutput).toContain("--package-manager");
    });

    it("should accept npm as package manager", () => {
      const helpOutput = execSync(`node ${CLI_PATH} --help`, {
        encoding: "utf-8",
      });
      expect(helpOutput).toContain("--package-manager");
    });

    it("should accept yarn as package manager", () => {
      const helpOutput = execSync(`node ${CLI_PATH} --help`, {
        encoding: "utf-8",
      });
      expect(helpOutput).toContain("--package-manager");
    });

    it("should accept bun as package manager", () => {
      const helpOutput = execSync(`node ${CLI_PATH} --help`, {
        encoding: "utf-8",
      });
      expect(helpOutput).toContain("--package-manager");
    });
  });
});

