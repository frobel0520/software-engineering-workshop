import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { TOPIC_MODULE_IDS } from "../registry";

describe("PostgreSQL topic integration contract", () => {
  it("is ready in the Core curriculum and has lesson and Lab routes", () => {
    const postgresqlTopic = curriculum.tracks
      .flatMap((track) => track.topics)
      .find((topic) => topic.id === "postgresql");

    expect(postgresqlTopic?.status).toBe("ready");
    expect(resolveRoute("#/postgresql", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lesson",
      topicId: "postgresql",
    });
    expect(resolveRoute("#/postgresql-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lab",
      topicId: "postgresql",
    });
  });

  it("contributes PostgreSQL completion to Core without changing the 19-topic denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["postgresql"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 13, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
