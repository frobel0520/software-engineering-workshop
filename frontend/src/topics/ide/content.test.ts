import { describe, expect, it } from "vitest";
import {
  ideCommandFixtures,
  ideFileFixture,
  ideInitialState,
  ideLesson,
  ideLessonSteps,
  idePausedVariables,
} from "./content";

describe("IDE topic content contract", () => {
  it("provides teachable objectives and unique lesson sections", () => {
    expect(ideLesson.objectives).toHaveLength(3);
    expect(ideLesson.sections).toHaveLength(4);
    expect(new Set(ideLesson.sections.map((section) => section.id)).size).toBe(ideLesson.sections.length);
  });

  it("maps lesson steps to the deterministic debugger flow", () => {
    expect(ideLessonSteps.map((step) => step.id)).toEqual([
      "open",
      "breakpoint",
      "run",
      "inspect",
      "step",
      "continue",
    ]);
    expect(ideLessonSteps.map((step) => step.command)).toEqual([
      "open src/order.ts",
      "breakpoint 3",
      "run calculateTotal(10, 2, 3)",
      "inspect variables",
      "step over",
      "continue",
    ]);
  });

  it("locks the file fixture and debugger state observations", () => {
    expect(ideFileFixture).toMatchObject({ path: "src/order.ts", language: "typescript" });
    expect(ideFileFixture.content.split("\n")).toHaveLength(5);
    expect(idePausedVariables).toEqual({ price: "10", quantity: "2", discount: "3", subtotal: "20" });
    expect(ideCommandFixtures.map((fixture) => fixture.eventType)).toEqual([
      "open-file",
      "set-breakpoint",
      "run",
      "inspect",
      "step-over",
      "continue",
    ]);
  });

  it("starts from a deterministic browser-only fixture", () => {
    expect(ideInitialState).toMatchObject({
      phase: "initial",
      selectedFile: null,
      breakpointLines: [],
      currentLine: null,
      callStack: [],
      variables: {},
      output: [],
      completedStepIds: [],
      canReset: true,
    });
  });
});

