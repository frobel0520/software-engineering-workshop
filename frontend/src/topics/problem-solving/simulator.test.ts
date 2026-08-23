import { describe, expect, it } from "vitest";
import {
  problemSolvingFailureFixtures,
  problemSolvingLabHappyPath,
  problemSolvingLabInitialState,
} from "./content";
import {
  createInitialProblemSolvingState,
  isProblemSolvingLabComplete,
  resetProblemSolvingLab,
  runProblemSolvingEvent,
  runProblemSolvingEvents,
} from "./simulator";

describe("Problem-solving deterministic simulator", () => {
  it("starts with an empty incident board", () => {
    expect(createInitialProblemSolvingState()).toEqual(problemSolvingLabInitialState);
    expect(createInitialProblemSolvingState().selectedStepId).toBe("frame-problem");
    expect(createInitialProblemSolvingState().lastResult).toBeNull();
  });

  it("completes the full problem-solving workflow", () => {
    const result = runProblemSolvingEvents(problemSolvingLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedStepIds).toHaveLength(9);
    expect(result.state.reproduction).toBe("stable");
    expect(result.state.comparison).toBe("release-regression");
    expect(result.state.hypothesis).toBe("payment-timeout");
    expect(result.state.errorBoundary).toBe("caught-at-boundary");
    expect(result.state.fixApplied).toBe(true);
    expect(result.state.verification).toBe("passed");
    expect(result.state.prevention).toBe("written");
    expect(isProblemSolvingLabComplete(result.state)).toBe(true);
  });

  it("blocks an action when the learner skips the current method", () => {
    const result = runProblemSolvingEvent(createInitialProblemSolvingState(), { type: "collect-evidence" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.completedStepIds).toEqual([]);
    expect(result.state.lastMessage).toContain("問題陳述");
  });

  it("keeps each documented failure fixture deterministic", () => {
    problemSolvingFailureFixtures.forEach((fixture) => {
      const result = runProblemSolvingEvent(createInitialProblemSolvingState(), { type: fixture.event });
      expect(result.accepted).toBe(false);
      expect(result.output[0]).toContain("目前先做");
    });
  });

  it("resets to the same initial state after a completed run", () => {
    const first = runProblemSolvingEvents(problemSolvingLabHappyPath);
    const reset = runProblemSolvingEvent(first.state, { type: "reset" });

    expect(reset.accepted).toBe(true);
    expect(reset.state).toEqual(resetProblemSolvingLab());
    expect(runProblemSolvingEvents(problemSolvingLabHappyPath).state).toEqual(first.state);
  });
});
