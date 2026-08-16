import { describe, expect, it } from "vitest";
import { packageLabHappyPath } from "./content";
import { createInitialPackageState, runPackageEvents } from "./simulator";
import { packageLabProgress } from "./lab";

describe("package lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(packageLabProgress(createInitialPackageState())).toBe(0);
    expect(packageLabProgress(runPackageEvents(packageLabHappyPath).state)).toBe(100);
  });
});
