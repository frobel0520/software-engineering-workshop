import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { TOPIC_MODULE_IDS } from "../registry";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("Index and transaction topic integration contract", () => {
  it("is ready in the Core curriculum and has lesson and Lab routes", () => {
    const indexTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "index");

    expect(indexTopic?.status).toBe("ready");
    expect(resolveRoute("#/index", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lesson", topicId: "index" });
    expect(resolveRoute("#/index-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lab", topicId: "index" });
  });

  it("contributes Index completion to Core without changing the 19-topic denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["index"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 18, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
