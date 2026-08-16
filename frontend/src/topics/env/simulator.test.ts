import { describe, expect, it } from "vitest";
import {
  envFailureFixtures,
  envLabHappyPath,
  envLabInitialState,
} from "./content";
import {
  createInitialEnvState,
  envSimulator,
  isEnvLabComplete,
  resetEnvLab,
  runEnvEvent,
  runEnvEvents,
} from "./simulator";

describe("environment deterministic simulator", () => {
  it("starts from the safe example fixture", () => {
    expect(createInitialEnvState()).toEqual(envLabInitialState);
    expect(createInitialEnvState().loadedFiles).toEqual([]);
    expect(createInitialEnvState().localIgnored).toBe(false);
  });

  it("completes the source, validation, exposure, and ignore happy path", () => {
    const result = runEnvEvents(envLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.configState).toBe("valid");
    expect(result.state.exposureState).toBe("verified");
    expect(result.state.publicKeys).toEqual(["VITE_API_BASE_URL", "VITE_FEATURE_FLAG"]);
    expect(result.state.serverOnlyKeys).toEqual(["DATABASE_PASSWORD"]);
    expect(result.state.localIgnored).toBe(true);
    expect(isEnvLabComplete(result.state)).toBe(true);
  });

  it("blocks validation until local settings are loaded", () => {
    const result = runEnvEvent(createInitialEnvState(), { type: "validate-config" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.configState).toBe("unknown");
  });

  it("keeps the public and server-only boundary explicit", () => {
    const loaded = runEnvEvents(envLabHappyPath.slice(0, 3)).state;
    const result = runEnvEvent(loaded, { type: "check-exposure" });

    expect(result.accepted).toBe(true);
    expect(result.state.publicKeys).not.toContain("DATABASE_PASSWORD");
    expect(result.state.serverOnlyKeys).toContain("DATABASE_PASSWORD");
  });

  it("blocks out-of-order safety checks described by the failure fixtures", () => {
    const commands = envFailureFixtures.map((fixture) => fixture.command);
    expect(commands).toEqual(["npm run check-config", "npm run check-exposure", "git check-ignore .env.local"]);

    expect(runEnvEvent(createInitialEnvState(), { type: "check-exposure" }).state.phase).toBe("blocked");
    expect(runEnvEvent(createInitialEnvState(), { type: "check-ignore" }).state.phase).toBe("blocked");
  });

  it("resets and remains deterministic", () => {
    const first = runEnvEvents(envLabHappyPath);
    const second = runEnvEvents(envLabHappyPath);

    expect(first.state).toEqual(second.state);
    expect(first.results).toEqual(second.results);
    expect(resetEnvLab()).toEqual(createInitialEnvState());
    expect(envSimulator.reset()).toEqual(createInitialEnvState());
  });
});
