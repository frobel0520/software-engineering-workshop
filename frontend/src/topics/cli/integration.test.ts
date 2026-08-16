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

describe("CLI topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const cli = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "cli");
    const progress = aggregateProgress(curriculum, memoryRepository([]));

    expect(cli?.status).toBe("ready");
    expect(progress.coreProgress.ready).toBe(6);
    expect(progress.coreProgress.completed).toBe(0);
  });

  it("persists CLI completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, memoryRepository(["cli"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 6, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
