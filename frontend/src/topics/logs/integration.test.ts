import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { completionKeyFor } from "../../progress/repository";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { getTopicViewModule, TOPIC_MODULE_IDS } from "../registry";

describe("Logs topic integration contract", () => {
  it("is ready in the Core curriculum, registry, and lesson/Lab routes", () => {
    const logsTopic = curriculum.tracks
      .flatMap((track) => track.topics)
      .find((topic) => topic.id === "logs");

    expect(logsTopic?.status).toBe("ready");
    expect(getTopicViewModule("logs")).toBeDefined();
    expect(resolveRoute("#/logs", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lesson",
      topicId: "logs",
    });
    expect(resolveRoute("#/logs-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lab",
      topicId: "logs",
    });
  });

  it("uses the fixed completion key and contributes to Core progress", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["logs"]));

    expect(completionKeyFor("logs")).toBe("se-workshop-logs-complete");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 17, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
