export type ExecutionErrorType = "ELEMENT_NOT_FOUND" | "ACTION_BLOCKED" | "TIMEOUT";

export interface ExecutionError {
    type: ExecutionErrorType;
    message: string;
    retryable: boolean;
}

