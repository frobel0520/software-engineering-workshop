import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("Build topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const buildTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "build");
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository());

    expect(buildTopic?.status).toBe("ready");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 0 });
  });

  it("persists Build completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["build"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
