import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { completionKeyFor } from "../../progress/repository";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { getTopicViewModule, TOPIC_MODULE_IDS } from "../registry";

describe("Integration topic integration contract", () => {
  it("is ready in the Core curriculum, registry, and lesson/Lab routes", () => {
    const integrationTopic = curriculum.tracks
      .flatMap((track) => track.topics)
      .find((topic) => topic.id === "integration");

    expect(integrationTopic?.status).toBe("ready");
    expect(getTopicViewModule("integration")).toBeDefined();
    expect(resolveRoute("#/integration", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lesson",
      topicId: "integration",
    });
    expect(resolveRoute("#/integration-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lab",
      topicId: "integration",
    });
  });

  it("uses the fixed completion key and contributes to Core progress", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["integration"]));

    expect(completionKeyFor("integration")).toBe("se-workshop-integration-complete");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
