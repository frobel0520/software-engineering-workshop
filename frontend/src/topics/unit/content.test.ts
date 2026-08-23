import { describe, expect, it } from "vitest";
import {
  unitFailureFixtures,
  unitLabHappyPath,
  unitLesson,
  unitLessonSteps,
  unitResults,
  unitTestCases,
  unitBeforeFixTotal,
} from "./content";

describe("Unit testing lesson content", () => {
  it("answers the four orientation questions and states the learning contract", () => {
    expect(Object.values(unitLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(unitLesson.objectives).toHaveLength(4);
    expect(unitLesson.sections.map((section) => section.id)).toEqual([
      "boundary",
      "arrange",
      "red",
      "green",
      "edge",
      "regression",
    ]);
  });

  it("maps every testing method to one deterministic lab check", () => {
    expect(unitLessonSteps.map((step) => step.id)).toEqual(unitLabHappyPath.map((event) => event.type));
    expect(unitLessonSteps.every((step) => step.code.length > 10 && step.takeaway.length > 15)).toBe(true);
    expect(Object.keys(unitResults)).toHaveLength(unitLessonSteps.length);
    expect(unitFailureFixtures.map((fixture) => fixture.event)).toEqual([
      "arrange-fixture",
      "run-red",
      "fix-green",
    ]);
  });

  it("keeps every before-fix result consistent with the discount-ignoring implementation", () => {
    expect(unitTestCases.map((testCase) => testCase.actualBeforeFix)).toEqual([
      unitBeforeFixTotal(150, 10),
      unitBeforeFixTotal(0, 0),
      unitBeforeFixTotal(50, 80),
    ]);
    expect(unitTestCases.find((testCase) => testCase.id === "discount-floor")?.actualBeforeFix).toBe(50);
  });
});
