import { describe, expect, it } from "vitest";
import { parseRoute, ROUTE_REGISTRY, topicPath, trackPath } from "./registry";

describe("route registry", () => {
  it("preserves existing Git and Auth routes", () => {
    expect(parseRoute("#/git")).toEqual({ path: "/git", kind: "lesson", topicId: "git" });
    expect(parseRoute("#/lab")).toEqual({ path: "/lab", kind: "lab", topicId: "git" });
    expect(parseRoute("#/auth")).toEqual({ path: "/auth", kind: "lesson", topicId: "auth" });
    expect(parseRoute("#/auth-lab")).toEqual({ path: "/auth-lab", kind: "lab", topicId: "auth" });
    expect(ROUTE_REGISTRY).toHaveLength(5);
  });

  it("supports predictable routes for new topics", () => {
    expect(parseRoute("#/track/foundations")).toEqual({ path: "/track/foundations", kind: "track", trackId: "foundations" });
    expect(trackPath("foundations")).toBe("/track/foundations");
    expect(parseRoute("#/guardrail")).toEqual({ path: "/guardrail", kind: "lesson", topicId: "guardrail" });
    expect(parseRoute("#/guardrail-lab")).toEqual({ path: "/guardrail-lab", kind: "lab", topicId: "guardrail" });
    expect(topicPath("guardrail", "lesson")).toBe("/guardrail");
    expect(topicPath("guardrail", "lab")).toBe("/guardrail-lab");
    expect(parseRoute("#/cli")).toEqual({ path: "/cli", kind: "lesson", topicId: "cli" });
    expect(parseRoute("#/cli-lab")).toEqual({ path: "/cli-lab", kind: "lab", topicId: "cli" });
    expect(topicPath("cli", "lesson")).toBe("/cli");
    expect(topicPath("cli", "lab")).toBe("/cli-lab");
    expect(parseRoute("#/ide")).toEqual({ path: "/ide", kind: "lesson", topicId: "ide" });
    expect(parseRoute("#/ide-lab")).toEqual({ path: "/ide-lab", kind: "lab", topicId: "ide" });
    expect(topicPath("ide", "lesson")).toBe("/ide");
    expect(topicPath("ide", "lab")).toBe("/ide-lab");
    expect(parseRoute("#/package")).toEqual({ path: "/package", kind: "lesson", topicId: "package" });
    expect(parseRoute("#/package-lab")).toEqual({ path: "/package-lab", kind: "lab", topicId: "package" });
    expect(topicPath("package", "lesson")).toBe("/package");
    expect(topicPath("package", "lab")).toBe("/package-lab");
  });

  it("falls back to the map for unknown or unsafe paths", () => {
    expect(parseRoute("#/unknown path")).toEqual({ path: "/map", kind: "map" });
    expect(parseRoute("#/track/unknown path")).toEqual({ path: "/map", kind: "map" });
    expect(parseRoute("#//")).toEqual({ path: "/map", kind: "map" });
    expect(() => topicPath("../auth", "lesson")).toThrow("Invalid topic id");
    expect(() => trackPath("../foundations")).toThrow("Invalid topic id");
  });
});
