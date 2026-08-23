import { describe, expect, it } from "vitest";
import { runSimulatorEvents, runTopicFixture } from "../../testing/simulator";
import { cliLabInitialState, cliLessonSteps } from "./content";
import {
  cliCommand,
  cliLabIsComplete,
  cliSimulator,
  createCliLabState,
  runCliCommand,
  type CliLabEvent,
} from "./simulator";

const happyPath: readonly CliLabEvent[] = cliLessonSteps.map((step) => cliCommand(step.command));
const happyPathFixture = {
  initialState: createCliLabState(),
  events: happyPath,
  expected: {
    completed: true,
    finalState: runSimulatorEvents(cliSimulator, createCliLabState(), happyPath),
  },
};

describe("CLI Lab simulator", () => {
  it("completes the documented command flow", () => {
    const result = runTopicFixture(
      cliSimulator,
      happyPathFixture,
      cliLabIsComplete,
    );

    expect(result.completed).toBe(true);
    expect(result.state).toEqual(happyPathFixture.expected.finalState);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedStepIds).toEqual(["context", "navigate", "inspect", "search", "verify"]);
    expect(result.state.exitCode).toBe(0);
    expect(result.state.lastStream).toBe("stdout");
  });

  it("routes failures to stderr without changing cwd or progress", () => {
    const initial = createCliLabState();
    const result = runCliCommand(initial, "grep TODO app.ts");

    expect(result.accepted).toBe(false);
    expect(result.state.cwd).toBe("/workspace/project");
    expect(result.state.completedStepIds).toEqual([]);
    expect(result.state.stderr).toEqual(["grep: app.ts: file not found"]);
    expect(result.state.lastStream).toBe("stderr");
    expect(result.state.exitCode).toBe(2);
    expect(result.state.phase).toBe("failed");
  });

  it("supports cat without allowing it to skip acceptance steps", () => {
    const result = runCliCommand(createCliLabState(), "cat README.md");

    expect(result.accepted).toBe(true);
    expect(result.output).toEqual(["# CLI project"]);
    expect(result.state.completedStepIds).toEqual([]);
    expect(result.state.exitCode).toBe(0);
  });

  it("ignores blank commands without adding history or progress", () => {
    const initial = createCliLabState();

    expect(runCliCommand(initial, "   ").state).toBe(initial);
    expect(initial.commandHistory).toEqual([]);
    expect(initial.completedStepIds).toEqual([]);
  });

  it("resets completed and failed sessions to a deep-equal initial fixture", () => {
    const completed = runSimulatorEvents(cliSimulator, createCliLabState(), happyPath);
    const failed = runCliCommand(createCliLabState(), "unknown").state;

    expect(cliSimulator.reduce(completed, { type: "reset" })).toEqual(cliLabInitialState);
    expect(cliSimulator.reduce(failed, { type: "reset" })).toEqual(cliLabInitialState);
  });

  it("replays the same events deterministically", () => {
    const first = runSimulatorEvents(cliSimulator, createCliLabState(), happyPath);
    const second = runSimulatorEvents(cliSimulator, createCliLabState(), happyPath);

    expect(second).toEqual(first);
  });
});
