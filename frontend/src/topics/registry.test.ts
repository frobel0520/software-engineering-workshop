import { describe, expect, it } from "vitest";
import { curriculum } from "../curriculum";
import { getTopicNavigationEntries, getTopicViewModule, TOPIC_MODULE_IDS } from "./registry";

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

  it("does not expose a module for unknown topics", () => {
    expect(getTopicViewModule("planned-future-topic")).toBeUndefined();
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

  it("builds practice navigation from ready topics and their track kind", () => {
    const readyTopicIds = curriculum.tracks.flatMap((track) =>
      track.topics.filter((topic) => topic.status === "ready").map((topic) => topic.id),
    );
    const navigationEntries = getTopicNavigationEntries(curriculum);

    expect(navigationEntries.map((entry) => entry.topicId)).toEqual(readyTopicIds);
    expect(navigationEntries.filter((entry) => entry.trackKind === "core")).toHaveLength(19);
    expect(navigationEntries.filter((entry) => entry.trackKind === "extension").map((entry) => entry.topicId)).toEqual([
      "guardrail",
      "problem-solving",
    ]);
    expect(navigationEntries.find((entry) => entry.topicId === "rest")?.navigationLabel).toBe("FastAPI");
    expect(navigationEntries.find((entry) => entry.topicId === "guardrail")?.labNavigationLabel).toBe("Guardrail");
  });

  it("omits planned or unregistered topics from navigation", () => {
    const navigationEntries = getTopicNavigationEntries({
      version: 1,
      tracks: [
        {
          id: "future",
          title: "Future",
          description: "Future topics",
          kind: "core",
          topics: [
            { id: "planned-topic", title: "Planned", summary: "Not ready", status: "planned" },
            { id: "unregistered-topic", title: "Unregistered", summary: "No module", status: "ready" },
          ],
        },
      ],
    });

    expect(navigationEntries).toEqual([]);
  });
});
