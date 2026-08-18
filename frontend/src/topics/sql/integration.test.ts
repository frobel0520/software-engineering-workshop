import { describe, expect, it } from "vitest";
import curriculumData from "../../../../shared/curriculum.json";
import type { Curriculum } from "../../types";
import { aggregateProgress } from "../../progress/aggregation";
import { TOPIC_MODULE_IDS } from "../registry";
import { resolveRoute } from "../../routes/registry";
import type { ProgressRepository } from "../../progress/repository";

const curriculum = curriculumData as Curriculum;

function memoryRepository(completedTopicIds: readonly string[]): ProgressRepository {
  const completed = new Set(completedTopicIds);
  return {
    read: (topicId) => completed.has(topicId),
    markComplete: (topicId) => completed.add(topicId),
    clear: (topicId) => completed.delete(topicId),
  };
}

describe("SQL topic integration contract", () => {
  it("is ready in the Core curriculum and has lesson and Lab routes", () => {
    const sqlTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "sql");

    expect(sqlTopic?.status).toBe("ready");
    expect(resolveRoute("#/sql", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lesson", topicId: "sql" });
    expect(resolveRoute("#/sql-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lab", topicId: "sql" });
  });

  it("contributes SQL completion to Core without changing the 19-topic denominator", () => {
    const progress = aggregateProgress(curriculum, memoryRepository(["sql"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 10, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
