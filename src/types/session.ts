type SessionState = "idle" | "listening" | "executing" | "replanning";

export interface Session {
    id: string;
    state: SessionState;
};

export type SDKState =
  | { status: "idle" }
  | {
      status: "running";
      sessionId: string;
      taskId: string;
      stepIndex: number;
    }
  | { status: "completed" }
  | { status: "error"; error: string };
