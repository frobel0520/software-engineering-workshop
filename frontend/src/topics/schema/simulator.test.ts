import { describe, expect, it } from "vitest";
import { schemaFailureFixtures, schemaLabHappyPath, schemaLabInitialState } from "./content";
import {
  createInitialSchemaState,
  isSchemaLabComplete,
  resetSchemaLab,
  runSchemaEvent,
  runSchemaEvents,
  schemaSimulator,
} from "./simulator";

describe("Schema deterministic simulator", () => {
  it("starts before any model decision", () => {
    expect(createInitialSchemaState()).toEqual(schemaLabInitialState);
    expect(createInitialSchemaState().result).toBeNull();
    expect(createInitialSchemaState().phase).toBe("initial");
  });

  it("completes entity, key, relationship, nullable, and integrity decisions", () => {
    const result = runSchemaEvents(schemaLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedStepIds).toHaveLength(5);
    expect(result.state.result?.id).toBe("validate-integrity");
    expect(result.state.result?.rows).toHaveLength(4);
    expect(isSchemaLabComplete(result.state)).toBe(true);
  });

  it("blocks a relationship until primary keys exist", () => {
    const result = runSchemaEvent(createInitialSchemaState(), { type: "link-project-task" });

    expect(result.accepted).toBe(false);
    expect(result.state.phase).toBe("blocked");
    expect(result.state.result).toBeNull();
    expect(result.state.lastMessage).toContain("primary key");
  });

  it("blocks integrity checks until nullable rules are explicit", () => {
    const partial = runSchemaEvents(schemaLabHappyPath.slice(0, 3)).state;
    const result = runSchemaEvent(partial, { type: "validate-integrity" });

    expect(result.accepted).toBe(false);
    expect(result.state.lastMessage).toContain("required");
  });

  it("documents the main out-of-order failure fixtures", () => {
    expect(schemaFailureFixtures.map((fixture) => fixture.event)).toEqual(["define-keys", "link-project-task", "validate-integrity"]);
    expect(runSchemaEvent(createInitialSchemaState(), { type: "define-keys" }).accepted).toBe(false);
    expect(runSchemaEvent(createInitialSchemaState(), { type: "validate-integrity" }).accepted).toBe(false);
  });

  it("resets and remains deterministic", () => {
    const first = runSchemaEvents(schemaLabHappyPath);
    const second = runSchemaEvents(schemaLabHappyPath);

    expect(first.state).toEqual(second.state);
    expect(first.results).toEqual(second.results);
    expect(resetSchemaLab()).toEqual(createInitialSchemaState());
    expect(schemaSimulator.reset()).toEqual(createInitialSchemaState());
  });
});
