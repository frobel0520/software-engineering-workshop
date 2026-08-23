import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { TOPIC_MODULE_IDS } from "../registry";

describe("Unit testing topic integration contract", () => {
  it("is ready in the Core curriculum and has lesson and Lab routes", () => {
    const unitTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "unit");

    expect(unitTopic?.status).toBe("ready");
    expect(resolveRoute("#/unit", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lesson", topicId: "unit" });
    expect(resolveRoute("#/unit-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lab", topicId: "unit" });
  });

  it("contributes Unit completion to Core without changing the 19-topic denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["unit"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 17, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
