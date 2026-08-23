import { describe, expect, it } from "vitest";
import {
  dockerCommandFixtures,
  dockerFailureFixtures,
  dockerFileFixture,
  dockerFixture,
  dockerLesson,
  dockerLessonSteps,
  dockerScenarioFixtures,
} from "./content";

describe("Docker topic content contract", () => {
  it("explains image, Dockerfile, context, port, probe, and cleanup boundaries", () => {
    expect(dockerLesson.sections.map((section) => section.id)).toEqual([
      "image-and-container",
      "dockerfile-boundaries",
      "build-context",
      "reproducible-image",
      "published-port",
      "runtime-probe",
      "cleanup-and-repeat",
    ]);
    expect(dockerLesson.objectives).toHaveLength(6);
    expect(new Set(dockerLesson.sections.map((section) => section.id)).size).toBe(dockerLesson.sections.length);
  });

  it("keeps the static-site inputs and Dockerfile fixture deterministic", () => {
    expect(dockerFixture).toMatchObject({
      contextPath: ".",
      dockerfilePath: "Dockerfile",
      sourceArtifact: "dist/index.html",
      imageTag: "workshop-web:1",
      imageDigest: "sha256:docker-image-001",
      containerName: "workshop-web",
      containerPort: 80,
      hostPort: 8080,
      probePath: "/",
      probeStatus: 200,
      bodyMarker: "SE_WORKSHOP_HOME",
    });
    expect(dockerFileFixture).toEqual({
      path: "Dockerfile",
      lines: [
        "FROM nginx:alpine",
        "COPY dist/ /usr/share/nginx/html/",
        "EXPOSE 80",
      ],
    });
  });

  it("maps the lesson to the five observable Docker command stages", () => {
    expect(dockerLessonSteps.map((step) => step.id)).toEqual([
      "inspect-context",
      "build-image",
      "run-container",
      "verify-probe",
      "cleanup-container",
    ]);
    expect(dockerLessonSteps.map((step) => step.command)).toEqual([
      "cat Dockerfile && ls dist",
      "docker build -t workshop-web:1 .",
      "docker run --name workshop-web -p 8080:80 workshop-web:1",
      "curl http://localhost:8080/",
      "docker stop workshop-web && docker rm workshop-web",
    ]);
    expect(dockerCommandFixtures.map((fixture) => fixture.stepId)).toEqual(dockerLessonSteps.map((step) => step.id));
    expect(dockerCommandFixtures.every((fixture) => fixture.successEvidence.length > 0 && fixture.failureEvidence.length > 0)).toBe(true);
  });

  it("keeps the three scenarios distinct and daemon-free", () => {
    expect(dockerScenarioFixtures.map((scenario) => scenario.id)).toEqual([
      "static-site-success",
      "missing-build-artifact",
      "unpublished-container-port",
    ]);
    expect(dockerScenarioFixtures[0]).toMatchObject({
      artifactPresent: true,
      imageBuild: "succeeds",
      containerOutcome: "running",
      portMapping: "published",
      probeOutcome: "success",
    });
    expect(dockerScenarioFixtures[1]).toMatchObject({
      artifactPresent: false,
      imageBuild: "fails",
      containerOutcome: "not-created",
      failureBoundary: "copy",
    });
    expect(dockerScenarioFixtures[2]).toMatchObject({
      artifactPresent: true,
      imageBuild: "succeeds",
      containerOutcome: "running",
      portMapping: "absent",
      probeOutcome: "unreachable",
      failureBoundary: "host-port",
    });
  });

  it("documents the failure boundaries without executing real Docker", () => {
    expect(dockerFailureFixtures.map((fixture) => fixture.expectedBoundary)).toEqual([
      "build context",
      "image",
      "host port",
      "cleanup",
    ]);
    expect(dockerFailureFixtures.every((fixture) => fixture.message.length > 0)).toBe(true);
    expect(dockerCommandFixtures.some((fixture) => fixture.command.includes("docker"))).toBe(true);
  });
});
