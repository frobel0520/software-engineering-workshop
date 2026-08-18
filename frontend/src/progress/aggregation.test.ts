import { describe, expect, it } from "vitest";
import curriculumData from "../../../shared/curriculum.json";
import type { Curriculum } from "../types";
import { aggregateProgress, completedReadyTopicIds } from "./aggregation";
import type { ProgressRepository } from "./repository";

class MemoryProgressRepository implements ProgressRepository {
  constructor(private readonly completed = new Set<string>()) {}

  readonly reads: string[] = [];

  read(topicId: string): boolean {
    this.reads.push(topicId);
    return this.completed.has(topicId);
  }

  markComplete(topicId: string): void {
    this.completed.add(topicId);
  }

  clear(topicId: string): void {
    this.completed.delete(topicId);
  }
}

const curriculum = curriculumData as Curriculum;
const coreReadyTopicIds = curriculum.tracks
  .filter((track) => (track.kind ?? "core") === "core")
  .flatMap((track) => track.topics)
  .filter((topic) => topic.status === "ready")
  .map((topic) => topic.id);

describe("progress aggregation", () => {
  it("keeps Core progress separate and preserves the 19-topic denominator", () => {
    const repository = new MemoryProgressRepository(new Set(["git", "auth", "remote"]));
    const result = aggregateProgress(curriculum, repository);

    expect(result.coreProgress).toEqual({ kind: "core", total: 19, ready: coreReadyTopicIds.length, completed: 3, percent: 16 });
    expect(result.extensionProgress).toEqual({ kind: "extension", total: 1, ready: 1, completed: 0, percent: 0 });
    expect(repository.reads).toEqual([...coreReadyTopicIds, "guardrail"]);
  });

  it("does not count planned topics even when the repository contains a value", () => {
    const repository = new MemoryProgressRepository(new Set(curriculum.tracks.flatMap((track) => track.topics.map((topic) => topic.id))));
    const result = aggregateProgress(curriculum, repository);

    expect(result.coreProgress.completed).toBe(coreReadyTopicIds.length);
    expect(result.extensionProgress.completed).toBe(1);
    expect(repository.reads).toEqual([...coreReadyTopicIds, "guardrail"]);
  });

  it("calculates extension progress independently from Core", () => {
    const extensionCurriculum: Curriculum = {
      version: 1,
      tracks: [
        {
          id: "core-track",
          title: "Core",
          description: "Core topics",
          topics: [
            { id: "git", title: "Git", summary: "Version control", status: "ready" },
            { id: "future", title: "Future", summary: "Planned", status: "planned" },
          ],
        },
        {
          id: "extension-track",
          title: "Extension",
          description: "Optional topics",
          kind: "extension",
          topics: [
            { id: "guardrail", title: "Guardrail", summary: "Safety", status: "ready" },
            { id: "later", title: "Later", summary: "Planned", status: "planned" },
          ],
        },
      ],
    };
    const result = aggregateProgress(extensionCurriculum, new MemoryProgressRepository(new Set(["git", "guardrail"])));

    expect(result.coreProgress).toMatchObject({ total: 2, ready: 1, completed: 1, percent: 50 });
    expect(result.extensionProgress).toMatchObject({ total: 2, ready: 1, completed: 1, percent: 50 });
  });

  it("ignores completion keys for planned topics", () => {
    const repository = new MemoryProgressRepository(new Set(["git", "schema"]));

    expect(completedReadyTopicIds(curriculum, repository)).toEqual(["git"]);
  });
});
