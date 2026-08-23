import { describe, expect, it } from "vitest";
import {
  deployFailureFixtures,
  deployFixture,
  deployLesson,
  deployLessonSteps,
  deployScenarioFixtures,
  deployStageFixtures,
  deployWorkflowFixture,
} from "./content";

describe("Deploy lesson contract", () => {
  it("keeps the release boundary and orientation complete", () => {
    expect(deployLesson.orientation.what.length).toBeGreaterThan(20);
    expect(deployLesson.orientation.why.length).toBeGreaterThan(20);
    expect(deployLesson.orientation.when.length).toBeGreaterThan(20);
    expect(deployLesson.orientation.how.length).toBeGreaterThan(20);
    expect(deployLesson.sections.map((section) => section.id)).toEqual([
      "release-boundary",
      "workflow-input",
      "artifact-provenance",
      "publish-boundary",
      "rollback-boundary",
      "observe-and-record",
    ]);
    expect(deployLesson.objectives).toHaveLength(6);
  });

  it("matches the Pages workflow fixture and eight ordered stages", () => {
    expect(deployFixture).toMatchObject({
      workflowPath: ".github/workflows/deploy-pages.yml",
      releaseSource: "main",
      artifactPath: "frontend/dist",
      pagesBranch: "gh-pages",
      repositoryBasePath: "/software-engineering-workshop/",
    });
    expect(deployWorkflowFixture.lines).toContain("publish_branch: gh-pages");
    expect(deployWorkflowFixture.lines).toContain("npm test && npm run build:pages · cwd frontend");
    expect(deployLessonSteps.find((step) => step.id === "verify-pages-base")?.command).toBe("cat frontend/.env.pages");
    expect(deployLessonSteps).toHaveLength(8);
    expect(deployStageFixtures.map((fixture) => fixture.id)).toEqual(deployLessonSteps.map((step) => step.id));
    expect(deployStageFixtures.every((fixture) => fixture.successEvidence.length > 0 && fixture.failureEvidence.length > 0)).toBe(true);
  });

  it("defines success, blocked, and rollback scenarios without real deployment side effects", () => {
    expect(deployScenarioFixtures.map((scenario) => scenario.id)).toEqual([
      "main-pages-success",
      "missing-artifact-blocked",
      "rollback-after-probe-failure",
    ]);
    expect(deployScenarioFixtures[0]).toMatchObject({ artifactOutcome: "verified", publishOutcome: "published", finalRecord: "verified" });
    expect(deployScenarioFixtures[1]).toMatchObject({ artifactOutcome: "missing", publishOutcome: "blocked", finalRecord: "blocked" });
    expect(deployScenarioFixtures[2]).toMatchObject({ deploymentOutcome: "rolled-back", previousVerifiedVersion: "release-2026.08.16", finalRecord: "rolled-back" });
    expect(deployFailureFixtures.map((fixture) => fixture.expectedBoundary)).toEqual(["CI / artifact", "base path", "live probe", "verify / rollback"]);
  });
});
