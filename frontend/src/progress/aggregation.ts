import type { Curriculum } from "../types";
import type { TrackKind } from "../topics/types";
import type { ProgressRepository } from "./repository";

export interface TrackProgress {
  kind: TrackKind;
  total: number;
  ready: number;
  completed: number;
  percent: number;
}

export interface ProgressAggregation {
  coreProgress: TrackProgress;
  extensionProgress: TrackProgress;
}

export function completedReadyTopicIds(curriculum: Curriculum, repository: ProgressRepository): readonly string[] {
  return curriculum.tracks
    .flatMap((track) => track.topics)
    .filter((topic) => topic.status === "ready" && repository.read(topic.id))
    .map((topic) => topic.id);
}

function summarize(curriculum: Curriculum, repository: ProgressRepository, kind: TrackKind): TrackProgress {
  const tracks = curriculum.tracks.filter((track) => (track.kind ?? "core") === kind);
  const topics = tracks.flatMap((track) => track.topics);
  const readyTopics = topics.filter((topic) => topic.status === "ready");
  const completed = readyTopics.filter((topic) => repository.read(topic.id)).length;

  return {
    kind,
    total: topics.length,
    ready: readyTopics.length,
    completed,
    percent: topics.length === 0 ? 0 : Math.round((completed / topics.length) * 100),
  };
}

export function aggregateProgress(curriculum: Curriculum, repository: ProgressRepository): ProgressAggregation {
  return {
    coreProgress: summarize(curriculum, repository, "core"),
    extensionProgress: summarize(curriculum, repository, "extension"),
  };
}
