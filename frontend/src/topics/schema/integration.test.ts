import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { TOPIC_MODULE_IDS } from "../registry";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("Schema topic integration contract", () => {
  it("is ready in the Core curriculum and has lesson and Lab routes", () => {
    const schemaTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "schema");

    expect(schemaTopic?.status).toBe("ready");
    expect(resolveRoute("#/schema", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lesson", topicId: "schema" });
    expect(resolveRoute("#/schema-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lab", topicId: "schema" });
  });

  it("contributes Schema completion to Core without changing the 19-topic denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["schema"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
