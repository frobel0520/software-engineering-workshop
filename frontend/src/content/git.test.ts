import { describe, expect, it } from "vitest";
import { gitCommandGuide, gitPipeline } from "./git";

describe("Git lesson release contract", () => {
  it("explains all required Git and platform operations", () => {
    expect(gitCommandGuide).toHaveLength(12);
    expect(gitCommandGuide.map((guide) => guide.id)).toEqual([
      "clone",
      "checkout",
      "add",
      "commit",
      "stash",
      "fetch",
      "pull",
      "rebase",
      "cherry-pick",
      "push",
      "merge",
      "fork",
    ]);
    gitCommandGuide.forEach((guide) => {
      expect(guide.body.length).toBeGreaterThan(30);
      expect(guide.when.length).toBeGreaterThan(15);
      expect(guide.takeaway.length).toBeGreaterThan(10);
    });
  });

  it("explains the hosted pipeline after commit and push", () => {
    expect(gitPipeline.map(([label]) => label)).toEqual(["commit", "push", "PR／MR", "pipeline", "merge", "deploy"]);
    expect(gitPipeline.join(" ")).toContain("runner");
    expect(gitPipeline.join(" ")).toContain("npm ci");
  });
});
