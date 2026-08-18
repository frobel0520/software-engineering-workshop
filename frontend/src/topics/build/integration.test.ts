import { describe, expect, it } from "vitest";
import curriculumData from "../../../../shared/curriculum.json";
import type { Curriculum } from "../../types";
import { aggregateProgress } from "../../progress/aggregation";
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

describe("Build topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const buildTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "build");
    const progress = aggregateProgress(curriculum, memoryRepository([]));

    expect(buildTopic?.status).toBe("ready");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 10, completed: 0 });
  });

  it("persists Build completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, memoryRepository(["build"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 10, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
