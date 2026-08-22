import { describe, expect, it } from "vitest";
import { schemaLabHappyPath } from "./content";
import { createInitialSchemaState, runSchemaEvents } from "./simulator";
import { schemaLabProgress } from "./lab";

describe("Schema lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(schemaLabProgress(createInitialSchemaState())).toBe(0);
    expect(schemaLabProgress(runSchemaEvents(schemaLabHappyPath).state)).toBe(100);
  });
});
