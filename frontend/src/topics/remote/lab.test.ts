import { describe, expect, it } from "vitest";
import { remoteLabHappyPath } from "./content";
import { createInitialRemoteState, runRemoteEvents } from "./simulator";
import { remoteLabProgress } from "./lab";

describe("remote lab progress", () => {
  it("starts at zero and reaches 100 after the happy path", () => {
    expect(remoteLabProgress(createInitialRemoteState())).toBe(0);
    expect(remoteLabProgress(runRemoteEvents(remoteLabHappyPath).state)).toBe(100);
  });
});
