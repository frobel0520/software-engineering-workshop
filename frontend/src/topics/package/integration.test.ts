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

describe("Package topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const packageTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "package");
    const progress = aggregateProgress(curriculum, memoryRepository([]));

    expect(packageTopic?.status).toBe("ready");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 9, completed: 0 });
  });

  it("persists Package completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, memoryRepository(["package"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 9, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
