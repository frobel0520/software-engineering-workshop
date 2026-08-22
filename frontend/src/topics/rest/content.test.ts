import { describe, expect, it } from "vitest";
import { findRestCodeFile, findRestCodeLine, findRestScenario, restCodeFiles, restScenarios, restTraceStages } from "./content";

describe("REST teaching content", () => {
  it("annotates every displayed non-empty code line", () => {
    const lines = restCodeFiles.flatMap((file) => file.lines);

    expect(lines.length).toBeGreaterThan(50);
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length);
    lines.forEach((line) => {
      expect(line.code.trim()).not.toBe("");
      expect(line.explanation.trim()).not.toBe("");
      expect(line.timing.trim()).not.toBe("");
      expect(line.connection.trim()).not.toBe("");
      expect(line.consequence.trim()).not.toBe("");
      expect(line.stages.length).toBeGreaterThan(0);
    });
  });

  it("maps every lifecycle stage to at least one real code line", () => {
    const lines = restCodeFiles.flatMap((file) => file.lines);

    restTraceStages.forEach((stage) => {
      expect(lines.some((line) => line.stages.includes(stage.id))).toBe(true);
    });
  });

  it("defines the four required HTTP outcomes", () => {
    expect(restScenarios.map((scenario) => scenario.status)).toEqual([
      "201 Created",
      "200 OK",
      "404 Not Found",
      "422 Unprocessable Entity",
    ]);
    expect(restScenarios.find((scenario) => scenario.id === "validation-error")?.terminalStageId).toBe("validation");
    expect(restScenarios.find((scenario) => scenario.id === "validation-error")?.responseBody).toContain('"type": "greater_than"');
  });

  it("models dependency resolution before request validation", () => {
    expect(restTraceStages.map((stage) => stage.id)).toEqual([
      "browser",
      "cors",
      "routing",
      "dependency",
      "validation",
      "database",
      "response",
    ]);
  });

  it("fails explicitly for unknown fixture identifiers", () => {
    expect(() => findRestScenario("unknown")).toThrow("Unknown REST scenario fixture");
    expect(() => findRestCodeFile("unknown")).toThrow("Unknown REST code file fixture");
    expect(() => findRestCodeLine("unknown")).toThrow("Unknown REST code line fixture");
  });
});
