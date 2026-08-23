import { describe, expect, it } from "vitest";
import { problemSolvingLabHappyPath } from "./content";
import { createInitialProblemSolvingState, runProblemSolvingEvents } from "./simulator";
import { problemSolvingLabProgress } from "./lab";

describe("Problem-solving Lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(problemSolvingLabProgress(createInitialProblemSolvingState())).toBe(0);
    expect(problemSolvingLabProgress(runProblemSolvingEvents(problemSolvingLabHappyPath).state)).toBe(100);
  });
});
