import { describe, expect, it } from "vitest";
import { dockerStaticHappyPath } from "./simulator";
import { createInitialDockerState, runDockerEvents } from "./simulator";
import { dockerLabProgress } from "./lab";

describe("Docker Lab progress", () => {
  it("starts empty and records scenario progress without claiming full completion", () => {
    expect(dockerLabProgress(createInitialDockerState())).toBe(0);
    expect(dockerLabProgress(runDockerEvents(dockerStaticHappyPath).state)).toBe(27);
  });
});
