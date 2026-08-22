import { describe, expect, it } from "vitest";
import { curriculum, loadCurriculum } from "./curriculum";

describe("curriculum boundary", () => {
  it("loads the shared curriculum as a validated immutable data model", () => {
    expect(curriculum.version).toBe(1);
    expect(curriculum.tracks.every((track) => track.kind === "core" || track.kind === "extension")).toBe(true);
  });

  it("rejects a track without an explicit kind", () => {
    expect(() => loadCurriculum({
      version: 1,
      tracks: [{ id: "core", title: "Core", description: "Topics", topics: [] }],
    })).toThrow("kind");
  });

  it("rejects duplicate topic identifiers", () => {
    const topic = { id: "same", title: "Same", summary: "Same", status: "planned" };
    expect(() => loadCurriculum({
      version: 1,
      tracks: [{
        id: "core",
        title: "Core",
        description: "Topics",
        kind: "core",
        topics: [topic, topic],
      }],
    })).toThrow("topic ids must be unique");
  });
});
