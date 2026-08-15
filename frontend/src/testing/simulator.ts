import type { SimulatorDefinition, TopicTestFixture } from "../topics/types";

export function runSimulatorEvents<State, Event>(
  simulator: SimulatorDefinition<State, Event>,
  initialState: State,
  events: readonly Event[],
): State {
  return events.reduce((state, event) => simulator.reduce(state, event), initialState);
}

export function runTopicFixture<State, Event>(
  simulator: SimulatorDefinition<State, Event>,
  fixture: TopicTestFixture<State, Event>,
  isComplete: (state: State) => boolean,
): { state: State; completed: boolean } {
  const state = runSimulatorEvents(simulator, fixture.initialState, fixture.events);
  return { state, completed: isComplete(state) };
}

export function resetSimulator<State, Event>(
  simulator: SimulatorDefinition<State, Event>,
): State {
  return simulator.reset();
}
