import { describe, expect, it } from "vitest";
import {
  remoteLabHappyPath,
  remoteLabInitialState,
  remoteLesson,
  remoteLessonSteps,
} from "./content";

describe("remote topic content contract", () => {
  it("provides teachable objectives and unique lesson sections", () => {
    expect(remoteLesson.objectives).toHaveLength(3);
    expect(remoteLesson.sections).toHaveLength(4);
    expect(new Set(remoteLesson.sections.map((section) => section.id)).size).toBe(remoteLesson.sections.length);
  });

  it("maps the lesson examples to the remote collaboration flow", () => {
    expect(remoteLessonSteps.map((step) => step.id)).toEqual([
      "branch",
      "commit",
      "sync",
      "rebase",
      "publish",
    ]);
    expect(remoteLessonSteps.map((step) => step.command)).toContain("git fetch origin dev");
    expect(remoteLessonSteps.map((step) => step.command)).toContain("git rebase origin/dev");
  });

  it("starts the lab from the acceptance fixture and exposes the happy path", () => {
    expect(remoteLabInitialState).toMatchObject({
      phase: "initial",
      localBranch: "dev",
      remoteBranch: "absent",
      pullRequest: "none",
      checks: "not-run",
    });
    expect(remoteLabHappyPath.map((event) => event.type)).toEqual([
      "inspect",
      "branch",
      "commit",
      "fetch",
      "rebase",
      "push",
      "open-pr",
      "checks-pass",
      "merge",
    ]);
  });
});
