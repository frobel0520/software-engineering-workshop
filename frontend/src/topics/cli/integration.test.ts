import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { createMemoryProgressRepository } from "../../testing/progress";

describe("CLI topic integration contract", () => {
  it("is ready in the Core curriculum and contributes to the ready denominator", () => {
    const cli = curriculum.tracks.flatMap((track) => track.topics).find((topic) => topic.id === "cli");
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository());

    expect(cli?.status).toBe("ready");
    expect(progress.coreProgress.ready).toBe(16);
    expect(progress.coreProgress.completed).toBe(0);
  });

  it("persists CLI completion as Core progress without changing the denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["cli"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 16, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });
});
