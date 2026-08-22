import { describe, expect, it } from "vitest";
import {
  unitFailureFixtures,
  unitLabHappyPath,
  unitLabInitialState,
} from "./content";
import {
  createInitialUnitState,
  isUnitLabComplete,
  resetUnitLab,
  runUnitEvent,
  runUnitEvents,
} from "./simulator";

describe("Unit testing deterministic simulator", () => {
  it("starts with an empty test runner", () => {
    expect(createInitialUnitState()).toEqual(unitLabInitialState);
    expect(createInitialUnitState().selectedStepId).toBe("identify-boundary");
    expect(createInitialUnitState().suiteStatus).toBe("idle");
  });

  it("completes the red to green and regression workflow", () => {
    const result = runUnitEvents(unitLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedStepIds).toHaveLength(6);
    expect(result.state.boundary).toBe("pure-function");
    expect(result.state.suiteStatus).toBe("green");
    expect(result.state.implementationStatus).toBe("fixed");
    expect(result.state.passedTests).toBe(3);
    expect(isUnitLabComplete(result.state)).toBe(true);
  });

  it("blocks a check when the learner skips the current testing method", () => {
    const result = runUnitEvent(createInitialUnitState(), { type: "run-red" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.completedStepIds).toEqual([]);
    expect(result.state.lastMessage).toContain("Arrange");
  });

  it("keeps each documented failure fixture deterministic", () => {
    unitFailureFixtures.forEach((fixture) => {
      const result = runUnitEvent(createInitialUnitState(), { type: fixture.event });
      expect(result.accepted).toBe(false);
      expect(result.output[0]).toContain("請先");
    });
  });

  it("preserves the red signal until the smallest fix is applied", () => {
    const red = runUnitEvents(unitLabHappyPath.slice(0, 3));

    expect(red.state.suiteStatus).toBe("red");
    expect(red.state.implementationStatus).toBe("buggy");
    expect(red.state.passedTests).toBe(0);
  });

  it("resets to the same initial state after a completed run", () => {
    const first = runUnitEvents(unitLabHappyPath);
    const reset = runUnitEvent(first.state, { type: "reset" });

    expect(reset.accepted).toBe(true);
    expect(reset.state).toEqual(resetUnitLab());
    expect(runUnitEvents(unitLabHappyPath).state).toEqual(first.state);
  });
});
