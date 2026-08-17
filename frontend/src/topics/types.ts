export type TrackKind = "core" | "extension";

export type TopicStatus = "ready" | "planned";

export interface LessonOrientation {
  what: string;
  why: string;
  when: string;
  how: string;
}

export interface LessonSection {
  id: string;
  title: string;
  body: string;
}

export interface LessonDefinition {
  title: string;
  orientation: LessonOrientation;
  objectives: readonly string[];
  sections: readonly LessonSection[];
}

export interface LabDefinition<State> {
  title: string;
  completionRule: (state: State) => boolean;
}

export interface SimulatorDefinition<State, Event> {
  createInitialState: () => State;
  reduce: (state: State, event: Event) => State;
  reset: () => State;
}

export interface ProgressDefinition<State> {
  completionKey: string;
  isComplete: (state: State) => boolean;
}

export interface TopicModule<State, Event> {
  id: string;
  trackKind: TrackKind;
  lesson: LessonDefinition;
  lab: LabDefinition<State>;
  simulator: SimulatorDefinition<State, Event>;
  progress: ProgressDefinition<State>;
}

export interface TopicTestFixture<State, Event> {
  initialState: State;
  events: readonly Event[];
  expected: {
    completed: boolean;
    finalState: State;
  };
}
