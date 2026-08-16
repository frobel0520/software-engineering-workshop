import { describe, expect, it } from "vitest";
import { envLabHappyPath } from "./content";
import { createInitialEnvState, runEnvEvents } from "./simulator";
import { envLabProgress } from "./lab";

describe("environment lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(envLabProgress(createInitialEnvState())).toBe(0);
    expect(envLabProgress(runEnvEvents(envLabHappyPath).state)).toBe(100);
  });
});
