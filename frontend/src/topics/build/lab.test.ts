import { describe, expect, it } from "vitest";
import { buildLabHappyPath } from "./content";
import { createInitialBuildState, runBuildEvents } from "./simulator";
import { buildLabProgress } from "./lab";

describe("build lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(buildLabProgress(createInitialBuildState())).toBe(0);
    expect(buildLabProgress(runBuildEvents(buildLabHappyPath).state)).toBe(100);
  });
});
