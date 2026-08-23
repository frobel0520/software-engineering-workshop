import { describe, expect, it } from "vitest";
import { curriculum } from "../../curriculum";
import { aggregateProgress } from "../../progress/aggregation";
import { completionKeyFor } from "../../progress/repository";
import { resolveRoute } from "../../routes/registry";
import { createMemoryProgressRepository } from "../../testing/progress";
import { getTopicViewModule, TOPIC_MODULE_IDS } from "../registry";
import { deployGreenHappyPath, isDeployLabComplete, runDeployEvents } from "./simulator";

describe("Deploy topic integration contract", () => {
  it("is ready in the Core curriculum, registry, and lesson/Lab routes", () => {
    const deployTopic = curriculum.tracks
      .flatMap((track) => track.topics)
      .find((topic) => topic.id === "deploy");

    expect(deployTopic?.status).toBe("ready");
    expect(getTopicViewModule("deploy")).toBeDefined();
    expect(resolveRoute("#/deploy", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lesson",
      topicId: "deploy",
    });
    expect(resolveRoute("#/deploy-lab", curriculum, TOPIC_MODULE_IDS)).toMatchObject({
      kind: "lab",
      topicId: "deploy",
    });
  });

  it("uses the fixed completion key and closes the Core denominator at 19", () => {
    const progress = aggregateProgress(curriculum, createMemoryProgressRepository(["deploy"]));

    expect(completionKeyFor("deploy")).toBe("se-workshop-deploy-complete");
    expect(progress.coreProgress).toMatchObject({ total: 19, ready: 19, completed: 1 });
    expect(progress.extensionProgress.completed).toBe(0);
  });

  it("keeps Deploy completion behind all scenarios and deterministic replay", () => {
    const greenRun = runDeployEvents(deployGreenHappyPath);

    expect(greenRun.state.completedScenarioIds).toEqual(["main-pages-success"]);
    expect(isDeployLabComplete(greenRun.state)).toBe(false);
  });
});
