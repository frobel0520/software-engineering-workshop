import { describe, expect, it } from "vitest";
import type { Curriculum } from "../types";
import { parseRoute, resolveRoute, ROUTE_REGISTRY, topicPath, trackPath } from "./registry";

const routeCurriculum: Curriculum = {
  version: 1,
  tracks: [
    {
      id: "foundations",
      title: "Foundations",
      description: "Core topics",
      kind: "core",
      topics: [
        { id: "git", title: "Git", summary: "Version control", status: "ready" },
        { id: "env", title: "Environment", summary: "Configuration", status: "planned" },
      ],
    },
  ],
};

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
    expect(parseRoute("#/problem-solving")).toEqual({ path: "/problem-solving", kind: "lesson", topicId: "problem-solving" });
    expect(parseRoute("#/problem-solving-lab")).toEqual({ path: "/problem-solving-lab", kind: "lab", topicId: "problem-solving" });
    expect(topicPath("problem-solving", "lesson")).toBe("/problem-solving");
    expect(topicPath("problem-solving", "lab")).toBe("/problem-solving-lab");
    expect(parseRoute("#/docker")).toEqual({ path: "/docker", kind: "lesson", topicId: "docker" });
    expect(parseRoute("#/docker-lab")).toEqual({ path: "/docker-lab", kind: "lab", topicId: "docker" });
    expect(topicPath("docker", "lesson")).toBe("/docker");
    expect(topicPath("docker", "lab")).toBe("/docker-lab");
    expect(parseRoute("#/cicd")).toEqual({ path: "/cicd", kind: "lesson", topicId: "cicd" });
    expect(parseRoute("#/cicd-lab")).toEqual({ path: "/cicd-lab", kind: "lab", topicId: "cicd" });
    expect(topicPath("cicd", "lesson")).toBe("/cicd");
    expect(topicPath("cicd", "lab")).toBe("/cicd-lab");
    expect(parseRoute("#/deploy")).toEqual({ path: "/deploy", kind: "lesson", topicId: "deploy" });
    expect(parseRoute("#/deploy-lab")).toEqual({ path: "/deploy-lab", kind: "lab", topicId: "deploy" });
    expect(topicPath("deploy", "lesson")).toBe("/deploy");
    expect(topicPath("deploy", "lab")).toBe("/deploy-lab");
  });

  it("falls back to the map for unknown or unsafe paths", () => {
    expect(parseRoute("#/unknown path")).toEqual({ path: "/map", kind: "map" });
    expect(parseRoute("#/track/unknown path")).toEqual({ path: "/map", kind: "map" });
    expect(parseRoute("#//")).toEqual({ path: "/map", kind: "map" });
    expect(() => topicPath("../auth", "lesson")).toThrow("Invalid topic id");
    expect(() => trackPath("../foundations")).toThrow("Invalid topic id");
  });

  it("does not resolve planned or unknown topics as enterable routes", () => {
    expect(resolveRoute("#/env", routeCurriculum)).toEqual({ path: "/map", kind: "map" });
    expect(resolveRoute("#/unknown", routeCurriculum)).toEqual({ path: "/map", kind: "map" });
    expect(resolveRoute("#/git-lab", routeCurriculum)).toEqual({ path: "/git-lab", kind: "lab", topicId: "git" });
  });

  it("does not resolve a ready topic without a registered view", () => {
    expect(resolveRoute("#/git", routeCurriculum, new Set(["auth"]))).toEqual({ path: "/map", kind: "map" });
  });
});
