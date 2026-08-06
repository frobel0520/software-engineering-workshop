import { describe, expect, it } from "vitest";
import { initialGitState, LAB_STEPS, runGitCommand } from "./simulator";

describe("Git Lab simulator", () => {
  it("completes the guided branch and merge workflow", () => {
    let state = initialGitState();
    for (const step of LAB_STEPS) {
      const result = runGitCommand(state, step.command);
      expect(result.accepted).toBe(true);
      state = result.state;
    }
    expect(state.complete).toBe(true);
    expect(state.branch).toBe("main");
    expect(state.commits.map((commit) => commit.id)).toEqual(["A1", "B2", "C3", "M4"]);
  });

  it("does not mutate state when a command is not expected", () => {
    const state = initialGitState();
    const result = runGitCommand(state, "git merge feature/avatar");
    expect(result.accepted).toBe(false);
    expect(result.state).toBe(state);
  });

  it("allows status checks without skipping later steps", () => {
    let state = runGitCommand(initialGitState(), "git status").state;
    state = runGitCommand(state, "git status").state;
    expect(state.step).toBe(1);
    expect(state.workingFile).toBe("app.js");
  });
});
