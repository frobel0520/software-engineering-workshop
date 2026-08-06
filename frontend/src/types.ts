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
  topics: Topic[];
}

export interface Curriculum {
  version: number;
  tracks: Track[];
}
