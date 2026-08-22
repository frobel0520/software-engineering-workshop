import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("Package topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const packageTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "package");
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository());

    expect(packageTopic?.status).toBe("ready");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 14, completed: 0 });
  });

  it("persists Package completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["package"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 14, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
