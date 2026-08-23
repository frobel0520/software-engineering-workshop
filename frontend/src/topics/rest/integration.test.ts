import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { completionKeyFor } from "../../progress/repository";
import { resolveRoute } from "../../routes/registry";
import { TOPIC_MODULE_IDS, getTopicViewModule } from "../registry";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("REST topic integration", () => {
  it("is a ready Core topic with lesson and Lab routes", () => {
    const topic = curriculum.tracks.flatMap((track) => track.topics).find((candidate) => candidate.id === "rest");

    expect(topic?.status).toBe("ready");
    expect(getTopicViewModule("rest")).toBeDefined();
    expect(resolveRoute("#/rest", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lesson", topicId: "rest" });
    expect(resolveRoute("#/rest-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lab", topicId: "rest" });
  });

  it("uses an independent completion key and contributes to Core progress", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["rest"]));

    expect(completionKeyFor("rest")).toBe("se-workshop-rest-complete");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
