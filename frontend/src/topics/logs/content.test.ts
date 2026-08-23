import { describe, expect, it } from "vitest";
import {
  findLogsScenario,
  logsBaseRequest,
  logsFailureFixtures,
  logsFixtureRedactedFields,
  logsLesson,
  logsLessonSteps,
  logsRequiredScenarioIds,
  logsResults,
  logsSafeContextKeys,
  logsScenarios,
  logsSensitiveFieldNames,
} from "./content";

describe("Logs lesson content", () => {
  it("answers the four orientation questions and states the observability contract", () => {
    expect(Object.values(logsLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(logsLesson.objectives).toHaveLength(6);
    expect(logsLesson.sections.map((section) => section.id)).toEqual([
      "responsibility",
      "event-schema",
      "severity",
      "correlation",
      "redaction",
      "evidence",
      "regression",
    ]);
  });

  it("maps every lesson concept to one deterministic result table", () => {
    expect(logsLessonSteps.map((step) => step.id)).toEqual(logsLesson.sections.map((section) => section.id));
    expect(logsLessonSteps.every((step) => step.code.length > 10 && step.takeaway.length > 15)).toBe(true);
    expect(Object.keys(logsResults)).toHaveLength(logsLessonSteps.length);
    expect(logsSafeContextKeys).toEqual([
      "route",
      "method",
      "statusCode",
      "field",
      "dependency",
      "timeoutMs",
      "durationMs",
      "reason",
    ]);
  });

  it("keeps three scenario outcomes and event sequences deterministic", () => {
    expect(logsScenarios).toHaveLength(3);
    expect(logsRequiredScenarioIds).toEqual([
      "request-success",
      "validation-rejected",
      "dependency-timeout",
    ]);

    for (const scenario of logsScenarios) {
      expect(scenario.events.map((event) => event.sequence)).toEqual([1, 2]);
      expect(scenario.events.every((event) => event.correlationId === scenario.expected.correlationId)).toBe(true);
      expect(scenario.events[1]).toMatchObject({
        event: scenario.expected.terminalEvent,
        source: scenario.expected.terminalSource,
        level: scenario.expected.level,
        outcome: scenario.expected.outcome,
      });
      expect(scenario.events[1].context.statusCode).toBe(scenario.expected.statusCode);
      expect(scenario.events.every((event) => Number.isNaN(Date.parse(event.timestamp)) === false)).toBe(true);
    }

    expect(findLogsScenario("request-success").expected).toMatchObject({
      terminalEvent: "request.completed",
      terminalSource: "api",
      level: "info",
      statusCode: 201,
      outcome: "success",
    });
    expect(findLogsScenario("validation-rejected").expected).toMatchObject({
      terminalEvent: "request.validation_rejected",
      terminalSource: "validation",
      level: "warn",
      statusCode: 400,
      outcome: "rejected",
    });
    expect(findLogsScenario("dependency-timeout").expected).toMatchObject({
      terminalEvent: "dependency.timeout",
      terminalSource: "dependency",
      level: "error",
      statusCode: 503,
      outcome: "failed",
    });
  });

  it("proves redaction before serialized event output", () => {
    expect(logsSensitiveFieldNames).toEqual(["authorization", "password", "accessToken", "cookie", "email"]);
    expect(logsFixtureRedactedFields).toEqual(["authorization", "password", "accessToken", "cookie", "email"]);

    const sensitiveValues = logsSensitiveFieldNames.map((field) => logsBaseRequest[field]);
    const serializedEvents = JSON.stringify(logsScenarios.map((scenario) => scenario.events));

    sensitiveValues.forEach((value) => expect(serializedEvents).not.toContain(value));
    logsScenarios.forEach((scenario) => {
      scenario.events.forEach((event) => {
        expect(event.redactedFields).toEqual(logsFixtureRedactedFields);
        expect(Object.keys(event.context).every((key) => logsSafeContextKeys.includes(key as (typeof logsSafeContextKeys)[number]))).toBe(true);
      });
    });
  });

  it("keeps failure feedback actionable for the future simulator", () => {
    expect(logsFailureFixtures.map((fixture) => fixture.event)).toEqual([
      "inspect-without-scenario",
      "skip-event",
      "correlation-mismatch",
      "wrong-severity",
      "raw-sensitive-value",
    ]);
    expect(logsFailureFixtures.every((fixture) => fixture.message.length > 20 && fixture.evidence.length > 20)).toBe(true);
  });
});
