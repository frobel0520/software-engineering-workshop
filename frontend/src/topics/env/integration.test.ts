import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("Environment topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const envTopic = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "env");
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository());

    expect(envTopic?.status).toBe("ready");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 16, completed: 0 });
  });

  it("persists Environment completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["env"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 16, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
