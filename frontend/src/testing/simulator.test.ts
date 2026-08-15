import { describe, expect, it } from "vitest";
import type { SimulatorDefinition, TopicTestFixture } from "../topics/types";
import { resetSimulator, runSimulatorEvents, runTopicFixture } from "./simulator";

type State = { step: number };
type Event = { type: "advance" };

const simulator: SimulatorDefinition<State, Event> = {
  createInitialState: () => ({ step: 0 }),
  reduce: (state, event) => event.type === "advance" ? { step: state.step + 1 } : state,
  reset: () => ({ step: 0 }),
};

const fixture: TopicTestFixture<State, Event> = {
  initialState: simulator.createInitialState(),
  events: [{ type: "advance" }, { type: "advance" }],
  expected: { completed: true, finalState: { step: 2 } },
};

describe("simulator test harness", () => {
  it("replays a fixture and evaluates completion", () => {
    const result = runTopicFixture(simulator, fixture, (state) => state.step === 2);

    expect(result.state).toEqual(fixture.expected.finalState);
    expect(result.completed).toBe(fixture.expected.completed);
  });

  it("replays the same events deterministically", () => {
    const first = runSimulatorEvents(simulator, fixture.initialState, fixture.events);
    const second = runSimulatorEvents(simulator, fixture.initialState, fixture.events);

    expect(second).toEqual(first);
  });

  it("resets to the simulator initial boundary", () => {
    expect(resetSimulator(simulator)).toEqual(fixture.initialState);
  });
});
