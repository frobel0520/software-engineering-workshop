import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { completionKeyFor } from "../../progress/repository";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { getTopicViewModule, TOPIC_MODULE_IDS } from "../registry";
import { dockerStaticHappyPath, isDockerLabComplete, runDockerEvents } from "./simulator";

describe("Docker topic integration contract", () => {
  it("is ready in the Core curriculum, registry, and lesson/Lab routes", () => {
    const dockerTopic = curriculum.tracks
      .flatMap((track) => track.topics)
      .find((topic) => topic.id === "docker");

    expect(dockerTopic?.status).toBe("ready");
    expect(getTopicViewModule("docker")).toBeDefined();
    expect(resolveRoute("#/docker", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lesson",
      topicId: "docker",
    });
    expect(resolveRoute("#/docker-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lab",
      topicId: "docker",
    });
  });

  it("uses the fixed completion key and raises the ready denominator to 17", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["docker"]));

    expect(completionKeyFor("docker")).toBe("se-workshop-docker-complete");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 17, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });

  it("keeps Docker completion behind the full scenario and replay contract", () => {
    const staticRun = runDockerEvents(dockerStaticHappyPath);

    expect(staticRun.state.completedScenarioIds).toEqual(["static-site-success"]);
    expect(isDockerLabComplete(staticRun.state)).toBe(false);
  });
});
