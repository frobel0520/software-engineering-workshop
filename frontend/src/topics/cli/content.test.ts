import { describe, expect, it } from "vitest";
import {
  cliCommandFixtures,
  cliFailureFixtures,
  cliLabInitialState,
  cliLesson,
  cliLessonSteps,
} from "./content";

describe("CLI topic content contract", () => {
  it("provides teachable objectives and unique lesson sections", () => {
    expect(cliLesson.objectives).toHaveLength(3);
    expect(cliLesson.sections).toHaveLength(4);
    expect(new Set(cliLesson.sections.map((section) => section.id)).size).toBe(cliLesson.sections.length);
  });

  it("maps lesson steps to the deterministic command flow", () => {
    expect(cliLessonSteps.map((step) => step.id)).toEqual([
      "context",
      "navigate",
      "inspect",
      "search",
      "verify",
    ]);
    expect(cliLessonSteps.map((step) => step.command)).toEqual([
      "pwd",
      "cd src",
      "ls",
      "grep TODO app.ts",
      "npm test",
    ]);
  });

  it("keeps successful output, event, and completion mappings fixed", () => {
    expect(cliCommandFixtures.map((fixture) => fixture.eventType)).toEqual([
      "print-working-directory",
      "change-directory",
      "list-files",
      "search-file",
      "run-check",
    ]);
    expect(cliCommandFixtures.every((fixture) => fixture.exitCode === 0)).toBe(true);
  });

  it("defines failures that preserve the expected working directory", () => {
    expect(cliFailureFixtures.map((fixture) => fixture.exitCode)).toEqual([127, 1, 2, 1]);
    expect(cliFailureFixtures.every((fixture) => fixture.expectedCwd === "/workspace/project")).toBe(true);
    expect(cliFailureFixtures.every((fixture) => fixture.stderr.length > 0 && fixture.message.length > 0)).toBe(true);
  });

  it("starts from a deterministic browser-only fixture", () => {
    expect(cliLabInitialState).toMatchObject({
      cwd: "/workspace/project",
      phase: "initial",
      commandHistory: [],
      stdout: [],
      stderr: [],
      lastStream: null,
      exitCode: null,
      completedStepIds: [],
      canReset: true,
    });
    expect(cliLabInitialState.files.map((file) => file.path)).toEqual([
      "README.md",
      "package.json",
      "src/app.ts",
      ".env.example",
    ]);
  });
});

