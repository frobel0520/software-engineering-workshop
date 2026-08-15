import { describe, expect, it } from "vitest";
import type { TopicModule, TopicTestFixture } from "./types";

type FixtureState = {
  phase: "initial" | "completed";
  steps: number;
};

type FixtureEvent = { type: "complete-step" };

const fixtureModule: TopicModule<FixtureState, FixtureEvent> = {
  id: "fixture-topic",
  trackKind: "extension",
  lesson: {
    title: "Fixture topic",
    objectives: ["驗證 TopicModule 的最小欄位"],
    sections: [{ id: "intro", title: "Intro", body: "Fixture content" }],
  },
  lab: {
    title: "Fixture lab",
    completionRule: (state) => state.phase === "completed",
  },
  simulator: {
    createInitialState: () => ({ phase: "initial", steps: 0 }),
    reduce: (state, event) =>
      event.type === "complete-step"
        ? { phase: "completed", steps: state.steps + 1 }
        : state,
    reset: () => ({ phase: "initial", steps: 0 }),
  },
  progress: {
    completionKey: "se-workshop-fixture-topic-complete",
    isComplete: (state) => state.phase === "completed",
  },
};

const fixture: TopicTestFixture<FixtureState, FixtureEvent> = {
  initialState: fixtureModule.simulator.createInitialState(),
  events: [{ type: "complete-step" }],
  expected: {
    completed: true,
    finalState: { phase: "completed", steps: 1 },
  },
};

describe("TopicModule contract", () => {
  it("supports the minimum lesson, lab, simulator and progress boundaries", () => {
    const finalState = fixture.events.reduce(
      (state, event) => fixtureModule.simulator.reduce(state, event),
      fixture.initialState,
    );

    expect(finalState).toEqual(fixture.expected.finalState);
    expect(fixtureModule.lab.completionRule(finalState)).toBe(fixture.expected.completed);
    expect(fixtureModule.progress.isComplete(finalState)).toBe(fixture.expected.completed);
    expect(fixtureModule.trackKind).toBe("extension");
  });

  it("provides a deterministic reset boundary", () => {
    expect(fixtureModule.simulator.reset()).toEqual(fixture.initialState);
  });
});
