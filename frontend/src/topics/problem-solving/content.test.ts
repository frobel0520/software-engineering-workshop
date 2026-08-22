import { describe, expect, it } from "vitest";
import {
  problemSolvingFailureFixtures,
  problemSolvingIncident,
  problemSolvingLabHappyPath,
  problemSolvingLesson,
  problemSolvingLessonSteps,
  problemSolvingResults,
} from "./content";

describe("Problem-solving lesson content", () => {
  it("answers the four orientation questions and states the learning contract", () => {
    expect(Object.values(problemSolvingLesson.orientation).every((answer) => answer.length > 20)).toBe(true);
    expect(problemSolvingLesson.objectives).toHaveLength(5);
    expect(problemSolvingLesson.sections.map((section) => section.id)).toEqual([
      "frame",
      "reproduce",
      "evidence",
      "baseline",
      "hypothesis",
      "error-boundary",
      "fix",
      "verify",
      "prevent",
    ]);
  });

  it("maps every method to one deterministic lab check", () => {
    expect(problemSolvingIncident.title).toContain("/orders");
    expect(problemSolvingLessonSteps.map((step) => step.id)).toEqual(problemSolvingLabHappyPath.map((event) => event.type));
    expect(problemSolvingLessonSteps.every((step) => step.code.length > 10 && step.takeaway.length > 15)).toBe(true);
    expect(Object.keys(problemSolvingResults)).toHaveLength(problemSolvingLessonSteps.length);
    expect(problemSolvingFailureFixtures.map((fixture) => fixture.event)).toEqual([
      "reproduce",
      "collect-evidence",
      "apply-fix",
    ]);
  });
});
