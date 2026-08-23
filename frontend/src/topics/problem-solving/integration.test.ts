import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { TOPIC_MODULE_IDS } from "../registry";

describe("Problem-solving Extension topic integration contract", () => {
  it("is ready with lesson and Lab routes", () => {
    const topic = curriculum.tracks.flatMap((track) => track.topics).find((candidate) => candidate.id === "problem-solving");

    expect(topic?.status).toBe("ready");
    expect(resolveRoute("#/problem-solving", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lesson", topicId: "problem-solving" });
    expect(resolveRoute("#/problem-solving-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({ kind: "lab", topicId: "problem-solving" });
  });

  it("keeps Extension completion separate from the Core denominator", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["problem-solving"]));

    expect(progress.coreProgress).toMatchObject({ total: 19, completed: 0 });
    expect(progress.extensionProgress).toMatchObject({ total: 2, ready: 2, completed: 1, percent: 50 });
  });
});
