import { describe, expect, it } from "vitest";
import {
  packageLabHappyPath,
  packageLabInitialState,
  packageLockFixture,
  type PackageLabState,
} from "./content";
import {
  createInitialPackageState,
  isPackageLabComplete,
  packageSimulator,
  resetPackageLab,
  runPackageEvent,
  runPackageEvents,
} from "./simulator";

describe("package deterministic simulator", () => {
  it("starts from the acceptance fixture without installed modules", () => {
    expect(createInitialPackageState()).toEqual(packageLabInitialState);
    expect(createInitialPackageState().installedModules).toEqual([]);
    expect(createInitialPackageState().lockfile).toBeNull();
  });

  it("completes the manifest, lockfile, and clean install happy path", () => {
    const result = runPackageEvents(packageLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.manifest.dependencies).toEqual({ "@workshop/format": "^1.2.0" });
    expect(result.state.lockfile).toEqual(packageLockFixture);
    expect(result.state.installedModules).toEqual(["@workshop/format@1.3.0", "@workshop/shared@1.0.0"]);
    expect(result.state.installState).toBe("clean-installed");
    expect(isPackageLabComplete(result.state)).toBe(true);
  });

  it("blocks npm ci until the manifest and lockfile flow is ready", () => {
    const initialResult = runPackageEvent(createInitialPackageState(), { type: "clean-install" });
    expect(initialResult.accepted).toBe(false);
    expect(initialResult.state.phase).toBe("blocked");
    expect(initialResult.state.installedModules).toEqual([]);

    const inspected = runPackageEvent(createInitialPackageState(), { type: "inspect-manifest" }).state;
    const addResult = runPackageEvent(inspected, { type: "add-dependency", packageSpec: "@workshop/format@^1.2.0" });
    const staleResult = runPackageEvent(addResult.state, { type: "clean-install" });
    expect(staleResult.accepted).toBe(false);
    expect(staleResult.state.phase).toBe("blocked");
    expect(staleResult.state.lockfileState).toBe("stale");
  });

  it("rejects unknown packages without changing the manifest", () => {
    const inspected = runPackageEvent(createInitialPackageState(), { type: "inspect-manifest" }).state;
    const result = runPackageEvent(inspected, { type: "add-dependency", packageSpec: "@workshop/unknown@^1.0.0" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("failed");
    expect(result.state.manifest.dependencies).toEqual({});
    expect(result.state.lockfile).toBeNull();
  });

  it("fails clean install when the lockfile no longer matches the manifest", () => {
    const installed = runPackageEvents(packageLabHappyPath.slice(0, 4)).state;
    const mismatchedState: PackageLabState = {
      ...installed,
      manifest: { ...installed.manifest, dependencies: { "@workshop/format": "^9.0.0" } },
    };
    const result = runPackageEvent(mismatchedState, { type: "clean-install" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("failed");
    expect(result.state.installState).toBe("installed");
    expect(result.state.installedModules).toEqual(["@workshop/format@1.3.0", "@workshop/shared@1.0.0"]);
  });

  it("resets and remains deterministic", () => {
    const first = runPackageEvents(packageLabHappyPath);
    const second = runPackageEvents(packageLabHappyPath);

    expect(first.state).toEqual(second.state);
    expect(first.results).toEqual(second.results);
    expect(resetPackageLab()).toEqual(createInitialPackageState());
    expect(packageSimulator.reset()).toEqual(createInitialPackageState());
  });
});
