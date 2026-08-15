import { describe, expect, it } from "vitest";
import { runSimulatorEvents, runTopicFixture } from "../../testing/simulator";
import { ideInitialState, ideLessonSteps } from "./content";
import {
  createIdeLabState,
  ideCommand,
  ideLabIsComplete,
  ideSimulator,
  runIdeCommand,
  type IdeLabEvent,
} from "./simulator";

const happyPath: readonly IdeLabEvent[] = ideLessonSteps.map((step) => ideCommand(step.command));
const happyPathFixture = {
  initialState: createIdeLabState(),
  events: happyPath,
  expected: {
    completed: true,
    finalState: runSimulatorEvents(ideSimulator, createIdeLabState(), happyPath),
  },
};

describe("IDE Lab simulator", () => {
  it("completes the documented debugger flow", () => {
    const result = runTopicFixture(ideSimulator, happyPathFixture, ideLabIsComplete);

    expect(result.completed).toBe(true);
    expect(result.state).toEqual(happyPathFixture.expected.finalState);
    expect(result.state.phase).toBe("completed");
    expect(result.state.currentLine).toBeNull();
    expect(result.state.output.at(-1)).toBe("17");
    expect(result.state.exitCode).toBe(0);
    expect(result.state.lastStream).toBe("stdout");
  });

  it("pauses at the breakpoint with the expected frame and variables", () => {
    let state = createIdeLabState();
    state = runIdeCommand(state, "open src/order.ts").state;
    state = runIdeCommand(state, "breakpoint 3").state;
    const result = runIdeCommand(state, "run calculateTotal(10, 2, 3)");

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("paused");
    expect(result.state.currentLine).toBe(3);
    expect(result.state.callStack).toEqual(["calculateTotal"]);
    expect(result.state.variables).toEqual({ price: "10", quantity: "2", discount: "3", subtotal: "20" });
  });

  it("requires a breakpoint before run and preserves the editor context on failure", () => {
    const opened = runIdeCommand(createIdeLabState(), "open src/order.ts").state;
    const result = runIdeCommand(opened, "run calculateTotal(10, 2, 3)");

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("failed");
    expect(result.state.selectedFile).toBe("src/order.ts");
    expect(result.state.breakpointLines).toEqual([]);
    expect(result.state.callStack).toEqual([]);
    expect(result.state.lastStream).toBe("stderr");
    expect(result.state.exitCode).toBe(2);
  });

  it("does not allow step over or inspect before paused state", () => {
    const initial = createIdeLabState();
    const inspect = runIdeCommand(initial, "inspect variables");
    const step = runIdeCommand(initial, "step over");

    expect(inspect.accepted).toBe(false);
    expect(step.accepted).toBe(false);
    expect(inspect.state.currentLine).toBeNull();
    expect(step.state.variables).toEqual({});
  });

  it("ignores blank commands and resets failed or completed sessions", () => {
    const initial = createIdeLabState();
    expect(runIdeCommand(initial, "   ").state).toBe(initial);

    const failed = runIdeCommand(initial, "unknown").state;
    const completed = runSimulatorEvents(ideSimulator, createIdeLabState(), happyPath);

    expect(ideSimulator.reduce(failed, { type: "reset" })).toEqual(ideInitialState);
    expect(ideSimulator.reduce(completed, { type: "reset" })).toEqual(ideInitialState);
  });

  it("replays the same debugger events deterministically", () => {
    const first = runSimulatorEvents(ideSimulator, createIdeLabState(), happyPath);
    const second = runSimulatorEvents(ideSimulator, createIdeLabState(), happyPath);

    expect(second).toEqual(first);
  });
});
