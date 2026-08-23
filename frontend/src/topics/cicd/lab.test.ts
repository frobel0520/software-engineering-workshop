import { describe, expect, it } from "vitest";
import { cicdGreenHappyPath, createInitialCicdState, runCicdEvents } from "./simulator";
import { cicdLabProgress } from "./lab";

describe("CI/CD Lab progress", () => {
  it("starts empty and records the first pipeline without claiming full completion", () => {
    expect(cicdLabProgress(createInitialCicdState())).toBe(0);
    expect(cicdLabProgress(runCicdEvents(cicdGreenHappyPath).state)).toBe(20);
  });
});
