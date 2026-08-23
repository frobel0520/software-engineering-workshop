import { describe, expect, it } from "vitest";
import { createInitialDeployState, deployGreenHappyPath, runDeployEvents } from "./simulator";
import { deployLabProgress } from "./lab";

describe("Deploy Lab progress", () => {
  it("starts empty and records the first release without claiming full completion", () => {
    expect(deployLabProgress(createInitialDeployState())).toBe(0);
    expect(deployLabProgress(runDeployEvents(deployGreenHappyPath).state)).toBe(27);
  });
});
