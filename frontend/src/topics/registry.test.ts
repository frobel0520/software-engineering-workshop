import { describe, expect, it } from "vitest";
import curriculumData from "../../../shared/curriculum.json";
import type { Curriculum } from "../types";
import { getTopicViewModule, TOPIC_MODULE_IDS } from "./registry";

const curriculum = curriculumData as Curriculum;

describe("topic view registry", () => {
  it("registers exactly every ready curriculum topic", () => {
    const readyTopicIds = curriculum.tracks
      .flatMap((track) => track.topics)
      .filter((topic) => topic.status === "ready")
      .map((topic) => topic.id)
      .sort();

    expect([...TOPIC_MODULE_IDS].sort()).toEqual(readyTopicIds);
    readyTopicIds.forEach((topicId) => expect(getTopicViewModule(topicId)).toBeDefined());
  });

  it("does not expose a module for planned topics", () => {
    expect(getTopicViewModule("sql")).toBeUndefined();
  });

  it("requires every ready topic to answer the four orientation questions", () => {
    const fields = ["what", "why", "when", "how"] as const;

    curriculum.tracks
      .flatMap((track) => track.topics)
      .filter((topic) => topic.status === "ready")
      .forEach((topic) => {
        const orientation = getTopicViewModule(topic.id)?.orientation;
        expect(orientation).toBeDefined();
        fields.forEach((field) => {
          expect(orientation?.[field].trim().length).toBeGreaterThan(20);
        });
      });
  });
});
