import { describe, expect, it } from "vitest";
import { indexLabHappyPath } from "./content";
import { createInitialIndexState, runIndexEvents } from "./simulator";
import { indexLabProgress } from "./lab";

describe("Index and transaction lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(indexLabProgress(createInitialIndexState())).toBe(0);
    expect(indexLabProgress(runIndexEvents(indexLabHappyPath).state)).toBe(100);
  });
});
