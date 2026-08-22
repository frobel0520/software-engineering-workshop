import { describe, expect, it } from "vitest";
import { unitLabHappyPath } from "./content";
import { createInitialUnitState, runUnitEvents } from "./simulator";
import { unitLabProgress } from "./lab";

describe("Unit testing Lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(unitLabProgress(createInitialUnitState())).toBe(0);
    expect(unitLabProgress(runUnitEvents(unitLabHappyPath).state)).toBe(100);
  });
});
