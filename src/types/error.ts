interface BaseError {
    source: "FOREMAN" | "WORKER";
    message: string;
    retryable: boolean;
}

export type ForemanErrorType = "TASK_NOT_POSSIBLE" | "DAG_NO_PATH" | "POLICY_VIOLATION" | "INSUFFICIENT_CONTEXT";

export interface ForemanError extends BaseError {
    source: "FOREMAN";
    type: ForemanErrorType;

    reason?: string;
    blockedBy?: "DAG" | "CONFIG" | "POLICY";
}

export type WorkerErrorType = "ELEMENT_NOT_FOUND" | "ACTION_BLOCKED" | "TIMEOUT" | "STALE_DOM";

export interface WorkerError extends BaseError {
    source: "WORKER";
    type: WorkerErrorType;

    stepIndex: number;

    domChanged?: boolean;
    suggestedAction?: "RETRY" | "REPLAN" | "ABORT";
}

export type ExecutionError = ForemanError | WorkerError;
