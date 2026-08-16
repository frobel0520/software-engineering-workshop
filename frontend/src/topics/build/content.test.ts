import { describe, expect, it } from "vitest";
import { buildFileFixtures, buildLesson, buildLessonSteps } from "./content";

describe("build lesson content", () => {
  it("explains source, gates, base paths, and preview", () => {
    expect(buildLesson.sections.map((section) => section.id)).toEqual([
      "source-to-artifact",
      "gates-before-bundle",
      "base-path",
      "preview-artifact",
    ]);
    expect(buildLesson.objectives).toHaveLength(4);
  });

  it("keeps every lab step mapped to a build fixture", () => {
    expect(buildLessonSteps).toHaveLength(5);
    expect(buildLessonSteps.map((step) => step.command)).toEqual([
      "cat package.json",
      "npm run lint",
      "VITE_BASE=/software-engineering-workshop/ npm run build",
      "ls dist",
      "npm run preview",
    ]);
    expect(buildFileFixtures.map((file) => file.name)).toEqual(["package.json", "vite.config.ts", "dist/"]);
  });
});
