import { describe, expect, it } from "vitest";
import {
  createInitialGitReleaseState,
  isGitProvider,
  isGitReleaseComplete,
  runGitReleaseCommand,
  runGitReleaseEvent,
  type GitReleaseState,
} from "./release-simulator";

function runCommands(commands: readonly string[]): GitReleaseState {
  return commands.reduce((state, command) => {
    const result = runGitReleaseCommand(state, command);
    expect(result.accepted, `${command}: ${result.output.join(" ")}`).toBe(true);
    return result.state;
  }, createInitialGitReleaseState());
}

describe("Git cowork release simulator", () => {
  it("accepts only supported provider values at the input boundary", () => {
    expect(isGitProvider("github")).toBe(true);
    expect(isGitProvider("gitlab")).toBe(true);
    expect(isGitProvider("bitbucket")).toBe(false);
  });

  it("completes the local-to-pipeline cowork workflow", () => {
    const state = runCommands([
      "Fork repository",
      "git clone <your-url>",
      "git checkout -b feature/profile",
      "git stash",
      "git stash pop",
      "git diff",
      "git add src/profile.ts",
      'git commit -m "add profile page"',
      "git fetch origin",
      "git pull --rebase origin dev",
      "git rebase origin/dev",
      "git cherry-pick a1b2c3d",
      "git push -u origin feature/profile",
      "Open PR",
    ]);

    const failedPipeline = runGitReleaseCommand(state, "Run pipeline");
    expect(failedPipeline.accepted).toBe(true);
    expect(failedPipeline.state.pipeline).toBe("failed");
    expect(failedPipeline.state.complete).toBe(false);

    const resolved = runGitReleaseEvent(failedPipeline.state, { type: "resolve-conflict" });
    expect(resolved.accepted).toBe(true);
    const passed = runGitReleaseCommand(resolved.state, "Run pipeline");
    expect(passed.state.pipeline).toBe("passed");
    expect(passed.state.pipelineJobs).toEqual(["checkout", "install", "test", "lint", "build"]);

    const merged = runGitReleaseCommand(passed.state, "Merge PR");
    expect(merged.accepted).toBe(true);
    expect(isGitReleaseComplete(merged.state)).toBe(true);
    expect(merged.state.review).toBe("merged");
    expect(merged.state.localCommitCount).toBe(2);
  });

  it("keeps invalid order deterministic and explains the next operation", () => {
    const initial = createInitialGitReleaseState();
    const result = runGitReleaseCommand(initial, "git pull --rebase origin dev");

    expect(result.accepted).toBe(false);
    expect(result.state).toBe(initial);
    expect(result.output.join(" ")).toContain("Fork");
  });

  it("rejects commands with unsupported suffixes instead of matching by prefix", () => {
    const initial = createInitialGitReleaseState();
    const invalidClone = runGitReleaseCommand(initial, "git clone --mirror <your-url>");
    const invalidCommit = runGitReleaseCommand(initial, "git commit --amend");

    expect(invalidClone.accepted).toBe(false);
    expect(invalidClone.state).toBe(initial);
    expect(invalidCommit.accepted).toBe(false);
    expect(invalidCommit.state).toBe(initial);
  });

  it("rejects force push after the workflow reaches the push step", () => {
    const beforePush = runCommands([
      "Fork repository",
      "git clone <your-url>",
      "git checkout -b feature/profile",
      "git stash",
      "git stash pop",
      "git diff",
      "git add src/profile.ts",
      'git commit -m "add profile page"',
      "git fetch origin",
      "git pull --rebase origin dev",
      "git rebase origin/dev",
      "git cherry-pick a1b2c3d",
    ]);
    const result = runGitReleaseCommand(beforePush, "git push --force");

    expect(result.accepted).toBe(false);
    expect(result.state).toBe(beforePush);
  });

  it("supports GitLab Merge Request terminology", () => {
    let state = createInitialGitReleaseState();
    state = runGitReleaseEvent(state, { type: "set-provider", provider: "gitlab" }).state;
    expect(state.provider).toBe("gitlab");
    expect(state.lastMessage).toContain("GitLab Merge Request");
  });
});
