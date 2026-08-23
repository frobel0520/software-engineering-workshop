import type { TrackKind } from "./topics/types";

export type TopicStatus = "ready" | "planned";

export interface Topic {
  id: string;
  title: string;
  summary: string;
  status: TopicStatus;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  kind: TrackKind;
  topics: readonly Topic[];
}

export interface Curriculum {
  version: number;
  tracks: readonly Track[];
}
