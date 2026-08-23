import { describe, expect, it } from "vitest";
import {
  createInitialLogsState,
  isLogsLabComplete,
  logsSimulator,
  resetLogsLab,
  runLogsEvent,
  runLogsEvents,
  type LogsLabEvent,
} from "./simulator";
import { findLogsScenario } from "./content";

const selectSuccess: LogsLabEvent = { type: "select-scenario", scenarioId: "request-success" };
const selectValidation: LogsLabEvent = { type: "select-scenario", scenarioId: "validation-rejected" };
const selectTimeout: LogsLabEvent = { type: "select-scenario", scenarioId: "dependency-timeout" };
const inspect = (sequence: number): LogsLabEvent => ({ type: "inspect-event", sequence });
const verifyCorrelation: LogsLabEvent = { type: "verify-correlation" };
const verifyRedaction: LogsLabEvent = { type: "verify-redaction" };
const verifyTerminal: LogsLabEvent = { type: "verify-terminal" };

function inspectAll(): LogsLabEvent[] {
  return [inspect(1), inspect(2)];
}

function completeScenario(select: LogsLabEvent): LogsLabEvent[] {
  return [select, ...inspectAll(), verifyCorrelation, verifyRedaction, verifyTerminal];
}

describe("Logs deterministic simulator", () => {
  it("starts at the documented initial state and requires a selected scenario", () => {
    const initial = createInitialLogsState();
    const result = runLogsEvent(initial, inspect(1));

    expect(initial).toEqual({
      phase: "initial",
      selectedScenarioId: null,
      activeEventIndex: 0,
      visibleEventIds: [],
      completedScenarioIds: [],
      correlationCheck: "pending",
      redactionCheck: "pending",
      terminalOutcome: null,
      lastFeedback: "none",
      lastMessage: "請先選擇固定 Logs scenario，再逐筆 inspect event。",
      canReset: true,
    });
    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.lastMessage).toContain("選擇");
  });

  it("requires event sequence order and recovers after a skipped event", () => {
    const selected = runLogsEvent(createInitialLogsState(), selectSuccess).state;
    const skipped = runLogsEvent(selected, inspect(2));

    expect(skipped.accepted).toBe(false);
    expect(skipped.state.phase).toBe("blocked");
    expect(skipped.state.activeEventIndex).toBe(0);
    expect(skipped.state.visibleEventIds).toEqual([]);
    expect(skipped.state.lastMessage).toContain("sequence");

    const recovered = runLogsEvent(skipped.state, inspect(1));
    expect(recovered.accepted).toBe(true);
    expect(recovered.state.phase).toBe("inspecting");
    expect(recovered.state.activeEventIndex).toBe(1);
    expect(recovered.state.visibleEventIds).toEqual(["request-success:1"]);
  });

  it("requires correlation and redaction checks before terminal outcome", () => {
    const inspected = runLogsEvents([selectSuccess, ...inspectAll()]).state;
    const terminalTooEarly = runLogsEvent(inspected, verifyTerminal);
    expect(terminalTooEarly.accepted).toBe(false);
    expect(terminalTooEarly.state.lastMessage).toContain("correlationId");

    const wrongCorrelation = runLogsEvent(inspected, {
      type: "verify-correlation",
      correlationId: "req-wrong",
    });
    expect(wrongCorrelation.accepted).toBe(false);
    expect(wrongCorrelation.state.correlationCheck).toBe("failed");
    expect(wrongCorrelation.state.lastMessage).not.toContain("req-wrong");

    const correlationPassed = runLogsEvent(wrongCorrelation.state, verifyCorrelation);
    expect(correlationPassed.accepted).toBe(true);
    expect(correlationPassed.state.correlationCheck).toBe("passed");

    const leaked = runLogsEvent(correlationPassed.state, {
      type: "verify-redaction",
      serializedOutput: `authorization=${findLogsScenario("request-success").request.authorization}`,
    });
    expect(leaked.accepted).toBe(false);
    expect(leaked.state.redactionCheck).toBe("failed");
    expect(leaked.state.lastFeedback).toBe("redaction-failed");
    expect(leaked.state.lastMessage).toContain("authorization");
    expect(leaked.state.lastMessage).not.toContain(findLogsScenario("request-success").request.authorization);

    const redactionPassed = runLogsEvent(leaked.state, verifyRedaction);
    expect(redactionPassed.accepted).toBe(true);
    expect(redactionPassed.state.redactionCheck).toBe("passed");

    const wrongSeverity = runLogsEvent(redactionPassed.state, {
      type: "verify-terminal",
      level: "error",
    });
    expect(wrongSeverity.accepted).toBe(false);
    expect(wrongSeverity.state.terminalOutcome).toBeNull();
    expect(wrongSeverity.state.lastMessage).toContain("level");

    const terminal = runLogsEvent(wrongSeverity.state, verifyTerminal);
    expect(terminal.accepted).toBe(true);
    expect(terminal.state.terminalOutcome).toBe("success");
    expect(terminal.state.completedScenarioIds).toEqual(["request-success"]);
  });

  it("preserves the expected severity and terminal outcome for rejection and timeout", () => {
    const validation = runLogsEvents(completeScenario(selectValidation));
    expect(validation.accepted).toBe(true);
    expect(validation.state.terminalOutcome).toBe("rejected");
    expect(validation.state.lastMessage).toContain("warn／400／rejected");

    const timeout = runLogsEvents(completeScenario(selectTimeout));
    expect(timeout.accepted).toBe(true);
    expect(timeout.state.terminalOutcome).toBe("failed");
    expect(timeout.state.lastMessage).toContain("error／503／failed");
    expect(timeout.state.lastMessage).toContain("correlation");
  });

  it("completes all scenarios deterministically and resets exactly", () => {
    const events = [
      ...completeScenario(selectSuccess),
      ...completeScenario(selectValidation),
      ...completeScenario(selectTimeout),
    ];
    const first = runLogsEvents(events);
    const second = runLogsEvents(events);

    expect(first.accepted).toBe(true);
    expect(isLogsLabComplete(first.state)).toBe(true);
    expect(first.state.phase).toBe("completed");
    expect(first.state.completedScenarioIds).toEqual([
      "request-success",
      "validation-rejected",
      "dependency-timeout",
    ]);
    expect(second.state).toEqual(first.state);

    const afterComplete = runLogsEvent(first.state, inspect(1));
    expect(afterComplete.accepted).toBe(false);
    expect(isLogsLabComplete(afterComplete.state)).toBe(true);
    expect(resetLogsLab()).toEqual(createInitialLogsState());
    expect(logsSimulator.reset()).toEqual(createInitialLogsState());
  });
});
