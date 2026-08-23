import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { completionKeyFor } from "../../progress/repository";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { getTopicViewModule, TOPIC_MODULE_IDS } from "../registry";
import { cicdGreenHappyPath, isCicdLabComplete, runCicdEvents } from "./simulator";

describe("CI/CD topic integration contract", () => {
  it("is ready in the Core curriculum, registry, and lesson/Lab routes", () => {
    const cicdTopic = curriculum.tracks
      .flatMap((track) => track.topics)
      .find((topic) => topic.id === "cicd");

    expect(cicdTopic?.status).toBe("ready");
    expect(getTopicViewModule("cicd")).toBeDefined();
    expect(resolveRoute("#/cicd", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lesson",
      topicId: "cicd",
    });
    expect(resolveRoute("#/cicd-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lab",
      topicId: "cicd",
    });
  });

  it("uses the fixed completion key and raises the ready denominator to 18", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["cicd"]));

    expect(completionKeyFor("cicd")).toBe("se-workshop-cicd-complete");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 18, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });

  it("keeps CI/CD completion behind all scenarios and deterministic replay", () => {
    const greenRun = runCicdEvents(cicdGreenHappyPath);

    expect(greenRun.state.completedScenarioIds).toEqual(["pull-request-green"]);
    expect(isCicdLabComplete(greenRun.state)).toBe(false);
  });
});
