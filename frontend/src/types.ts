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
  /** Existing curriculum data defaults to core until extension metadata is added. */
  kind?: TrackKind;
  topics: Topic[];
}

export interface Curriculum {
  version: number;
  tracks: Track[];
}
