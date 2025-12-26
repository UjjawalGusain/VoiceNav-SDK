type SessionState = "idle" | "listening" | "executing" | "replanning";

export interface Session {
    id: string;
    state: SessionState;
};
