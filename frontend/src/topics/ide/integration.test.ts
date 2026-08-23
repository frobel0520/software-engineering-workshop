import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("IDE topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const ide = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "ide");
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository());

    expect(ide?.status).toBe("ready");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 0 });
  });

  it("persists IDE completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["ide"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
