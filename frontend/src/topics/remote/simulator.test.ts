import { describe, expect, it } from "vitest";
import { remoteLabHappyPath } from "./content";
import {
  createInitialRemoteState,
  isRemoteLabComplete,
  resetRemoteLab,
  runRemoteEvent,
  runRemoteEvents,
} from "./simulator";

describe("remote collaboration simulator", () => {
  it("completes the deterministic happy path", () => {
    const result = runRemoteEvents(remoteLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.results).toHaveLength(remoteLabHappyPath.length);
    expect(isRemoteLabComplete(result.state)).toBe(true);
    expect(result.state.pullRequest).toBe("merged");
  });

  it("blocks rebase before fetch without mutating the prior state", () => {
    const start = createInitialRemoteState();
    const branched = runRemoteEvent(start, { type: "branch" }).state;
    const committed = runRemoteEvent(branched, { type: "commit" }).state;
    const result = runRemoteEvent(committed, { type: "rebase" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.syncState).toBe("stale");
    expect(committed.phase).toBe("active");
    expect(committed.syncState).toBe("stale");
  });

  it("requires passed checks before merge and supports recovery", () => {
    const beforeMerge = runRemoteEvents([
      { type: "branch" },
      { type: "commit" },
      { type: "fetch" },
      { type: "rebase" },
      { type: "push" },
      { type: "open-pr" },
    ]);
    const blockedMerge = runRemoteEvent(beforeMerge.state, { type: "merge" });
    const passedChecks = runRemoteEvent(blockedMerge.state, { type: "checks-pass" });
    const merged = runRemoteEvent(passedChecks.state, { type: "merge" });

    expect(blockedMerge.accepted).toBe(false);
    expect(passedChecks.accepted).toBe(true);
    expect(isRemoteLabComplete(merged.state)).toBe(true);
  });

  it("resets to the exact initial fixture and remains deterministic", () => {
    const first = runRemoteEvents(remoteLabHappyPath).state;
    const second = runRemoteEvents(remoteLabHappyPath).state;

    expect(second).toEqual(first);
    expect(resetRemoteLab()).toEqual(createInitialRemoteState());
  });
});
