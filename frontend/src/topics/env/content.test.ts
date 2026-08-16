import { describe, expect, it } from "vitest";
import { envLesson, envLessonSteps, envFileFixtures } from "./content";

describe("environment lesson content", () => {
  it("explains source, mode, public boundary, and local protection", () => {
    expect(envLesson.sections.map((section) => section.id)).toEqual([
      "config-is-input",
      "load-by-mode",
      "public-boundary",
      "validate-and-ignore",
    ]);
    expect(envLesson.objectives).toHaveLength(4);
  });

  it("keeps every lab step mapped to a fixture concept", () => {
    expect(envLessonSteps).toHaveLength(5);
    expect(envLessonSteps.map((step) => step.command)).toEqual([
      "cat .env.example",
      "cp .env.example .env.local",
      "npm run check-config",
      "npm run check-exposure",
      "git check-ignore .env.local",
    ]);
    expect(envFileFixtures.map((file) => file.name)).toEqual([".env.example", ".env.local", "src/config.ts"]);
  });
});
