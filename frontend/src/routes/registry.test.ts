import { describe, expect, it } from "vitest";
import { parseRoute, ROUTE_REGISTRY, topicPath } from "./registry";

describe("route registry", () => {
  it("preserves existing Git and Auth routes", () => {
    expect(parseRoute("#/git")).toEqual({ path: "/git", kind: "lesson", topicId: "git" });
    expect(parseRoute("#/lab")).toEqual({ path: "/lab", kind: "lab", topicId: "git" });
    expect(parseRoute("#/auth")).toEqual({ path: "/auth", kind: "lesson", topicId: "auth" });
    expect(parseRoute("#/auth-lab")).toEqual({ path: "/auth-lab", kind: "lab", topicId: "auth" });
    expect(ROUTE_REGISTRY).toHaveLength(5);
  });

  it("supports predictable routes for new topics", () => {
    expect(parseRoute("#/guardrail")).toEqual({ path: "/guardrail", kind: "lesson", topicId: "guardrail" });
    expect(parseRoute("#/guardrail-lab")).toEqual({ path: "/guardrail-lab", kind: "lab", topicId: "guardrail" });
    expect(topicPath("guardrail", "lesson")).toBe("/guardrail");
    expect(topicPath("guardrail", "lab")).toBe("/guardrail-lab");
    expect(parseRoute("#/cli")).toEqual({ path: "/cli", kind: "lesson", topicId: "cli" });
    expect(parseRoute("#/cli-lab")).toEqual({ path: "/cli-lab", kind: "lab", topicId: "cli" });
    expect(topicPath("cli", "lesson")).toBe("/cli");
    expect(topicPath("cli", "lab")).toBe("/cli-lab");
  });

  it("falls back to the map for unknown or unsafe paths", () => {
    expect(parseRoute("#/unknown path")).toEqual({ path: "/map", kind: "map" });
    expect(parseRoute("#//")).toEqual({ path: "/map", kind: "map" });
    expect(() => topicPath("../auth", "lesson")).toThrow("Invalid topic id");
  });
});
