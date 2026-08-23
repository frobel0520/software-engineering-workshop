import { describe, expect, it } from "vitest";
import { buildFailureFixtures, buildLabHappyPath, buildLabInitialState } from "./content";
import {
  buildSimulator,
  createInitialBuildState,
  isBuildLabComplete,
  resetBuildLab,
  runBuildEvent,
  runBuildEvents,
} from "./simulator";

describe("build deterministic simulator", () => {
  it("starts from source scripts without an artifact", () => {
    expect(createInitialBuildState()).toEqual(buildLabInitialState);
    expect(createInitialBuildState().bundleState).toBe("missing");
    expect(createInitialBuildState().previewState).toBe("stopped");
  });

  it("completes the typecheck, bundle, artifact, and preview happy path", () => {
    const result = runBuildEvents(buildLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.typecheckState).toBe("passed");
    expect(result.state.bundleState).toBe("created");
    expect(result.state.artifactState).toBe("verified");
    expect(result.state.previewState).toBe("running");
    expect(result.state.basePath).toBe("/software-engineering-workshop/");
    expect(isBuildLabComplete(result.state)).toBe(true);
  });

  it("blocks build until the TypeScript gate has passed", () => {
    const result = runBuildEvent(createInitialBuildState(), { type: "bundle" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.bundleState).toBe("missing");
  });

  it("keeps artifact inspection and preview in order", () => {
    const built = runBuildEvents(buildLabHappyPath.slice(0, 3)).state;
    const previewBeforeInspect = runBuildEvent(built, { type: "preview" });
    expect(previewBeforeInspect.accepted).toBe(false);
    expect(previewBeforeInspect.state.previewState).toBe("stopped");

    const inspect = runBuildEvent(built, { type: "inspect-dist" });
    expect(inspect.accepted).toBe(true);
    expect(inspect.state.artifactState).toBe("verified");
  });

  it("documents the main out-of-order failure fixtures", () => {
    expect(buildFailureFixtures.map((fixture) => fixture.command)).toEqual([
      "npm run build:pages",
      "ls dist",
      "npm run preview",
    ]);
    expect(runBuildEvent(createInitialBuildState(), { type: "inspect-dist" }).state.phase).toBe("blocked");
    expect(runBuildEvent(createInitialBuildState(), { type: "preview" }).state.phase).toBe("blocked");
  });

  it("resets and remains deterministic", () => {
    const first = runBuildEvents(buildLabHappyPath);
    const second = runBuildEvents(buildLabHappyPath);

    expect(first.state).toEqual(second.state);
    expect(first.results).toEqual(second.results);
    expect(resetBuildLab()).toEqual(createInitialBuildState());
    expect(buildSimulator.reset()).toEqual(createInitialBuildState());
  });
});
