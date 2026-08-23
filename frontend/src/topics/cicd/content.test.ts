import { describe, expect, it } from "vitest";
import {
  cicdFailureFixtures,
  cicdFixture,
  cicdLesson,
  cicdLessonSteps,
  cicdScenarioFixtures,
  cicdStageFixtures,
  cicdWorkflowFixture,
} from "./content";

describe("CI/CD topic content contract", () => {
  it("explains CI/CD boundaries, triggers, ordered gates, and replay", () => {
    expect(cicdLesson.sections.map((section) => section.id)).toEqual([
      "ci-cd-boundary",
      "trigger-and-ref",
      "checkout-and-cache",
      "ordered-gates",
      "required-check",
      "failure-boundary",
      "repeatable-pipeline",
    ]);
    expect(cicdLesson.objectives).toHaveLength(6);
    expect(new Set(cicdLesson.sections.map((section) => section.id)).size).toBe(cicdLesson.sections.length);
  });

  it("keeps the workflow fixture aligned with the repository CI contract", () => {
    expect(cicdFixture).toMatchObject({
      workflowPath: ".github/workflows/ci.yml",
      workflowName: "CI",
      jobId: "frontend",
      requiredCheck: "frontend",
      nodeVersion: "22",
      cacheDependencyPath: "frontend/package-lock.json",
      workingDirectory: "frontend",
      targetRefs: ["dev", "main"],
      sourceRef: "fixture/feature",
    });
    expect(cicdWorkflowFixture.path).toBe(".github/workflows/ci.yml");
    expect(cicdWorkflowFixture.lines).toContain("npm test · cwd frontend");
    expect(cicdWorkflowFixture.lines).toContain("npm run build · cwd frontend");
  });

  it("maps nine observable pipeline stages to lesson commands and evidence", () => {
    expect(cicdLessonSteps).toHaveLength(9);
    expect(cicdLessonSteps.map((step) => step.id)).toEqual([
      "inspect-workflow",
      "select-trigger",
      "checkout-source",
      "install-dependencies",
      "run-test",
      "run-lint",
      "run-build",
      "publish-required-check",
      "evaluate-merge-gate",
    ]);
    expect(cicdStageFixtures.map((fixture) => fixture.id)).toEqual(cicdLessonSteps.map((step) => step.id));
    expect(cicdStageFixtures.every((fixture) => fixture.successEvidence.length > 0 && fixture.failureEvidence.length > 0)).toBe(true);
  });

  it("keeps green, test failure, and build failure scenarios distinct", () => {
    expect(cicdScenarioFixtures.map((scenario) => scenario.id)).toEqual([
      "pull-request-green",
      "pull-request-test-failure",
      "pull-request-build-failure",
    ]);
    expect(cicdScenarioFixtures[0]).toMatchObject({
      triggerEvent: "pull_request",
      targetRef: "dev",
      testOutcome: "passed",
      lintOutcome: "passed",
      buildOutcome: "passed",
      requiredCheck: "passed",
      mergeGate: "mergeable",
    });
    expect(cicdScenarioFixtures[1]).toMatchObject({
      testOutcome: "failed",
      lintOutcome: "not-run",
      buildOutcome: "not-run",
      artifactState: "missing",
      requiredCheck: "failed",
      mergeGate: "blocked",
      failureStage: "run-test",
    });
    expect(cicdScenarioFixtures[2]).toMatchObject({
      testOutcome: "passed",
      lintOutcome: "passed",
      buildOutcome: "failed",
      artifactState: "missing",
      requiredCheck: "failed",
      mergeGate: "blocked",
      failureStage: "run-build",
    });
  });

  it("documents failure boundaries without running Actions or shell", () => {
    expect(cicdFailureFixtures.map((fixture) => fixture.expectedBoundary)).toEqual([
      "behavior gate",
      "TypeScript gate",
      "production artifact",
      "merge decision",
    ]);
    expect(cicdFailureFixtures.every((fixture) => fixture.command.length > 0 && fixture.message.length > 0)).toBe(true);
  });
});
