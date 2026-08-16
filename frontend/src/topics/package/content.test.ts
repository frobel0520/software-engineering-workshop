import { describe, expect, it } from "vitest";
import {
  packageFailureFixtures,
  packageLabHappyPath,
  packageLabInitialState,
  packageLesson,
  packageLessonSteps,
  packageLockFixture,
  packageManifestFixture,
  packageRegistryFixtures,
} from "./content";

describe("package topic content contract", () => {
  it("provides teachable objectives and unique lesson sections", () => {
    expect(packageLesson.objectives).toHaveLength(4);
    expect(packageLesson.sections).toHaveLength(4);
    expect(new Set(packageLesson.sections.map((section) => section.id)).size).toBe(packageLesson.sections.length);
  });

  it("maps lesson steps to the manifest, lockfile, and clean install flow", () => {
    expect(packageLessonSteps.map((step) => step.id)).toEqual([
      "inspect-manifest",
      "add-dependency",
      "install",
      "inspect-lockfile",
      "clean-install",
    ]);
    expect(packageLessonSteps.map((step) => step.command)).toContain("npm install @workshop/format@^1.2.0");
    expect(packageLessonSteps.map((step) => step.command)).toContain("npm ci");
  });

  it("starts from the acceptance fixture and exposes deterministic resolutions", () => {
    expect(packageManifestFixture).toMatchObject({
      name: "workshop-package-lab",
      packageManager: "npm@10.8.2",
      dependencies: {},
    });
    expect(packageRegistryFixtures.map((fixture) => fixture.name)).toEqual([
      "@workshop/format",
      "@workshop/shared",
    ]);
    expect(packageLockFixture.packages["node_modules/@workshop/format"]).toMatchObject({ version: "1.3.0", resolvedFrom: "fixture-registry" });
    expect(packageLockFixture.packages["node_modules/@workshop/shared"]).toMatchObject({ version: "1.0.0", resolvedFrom: "fixture-registry" });
    expect(packageLabInitialState).toMatchObject({ phase: "initial", lockfile: null, lockfileState: "missing", installState: "empty" });
  });

  it("keeps the happy path and failure boundaries explicit", () => {
    expect(packageLabHappyPath.map((event) => event.type)).toEqual([
      "inspect-manifest",
      "add-dependency",
      "install",
      "inspect-lockfile",
      "clean-install",
    ]);
    expect(packageLabHappyPath[1]).toEqual({ type: "add-dependency", packageSpec: "@workshop/format@^1.2.0" });
    expect(packageFailureFixtures.map((fixture) => fixture.expectedPhase)).toEqual(["blocked", "failed", "failed"]);
  });
});
