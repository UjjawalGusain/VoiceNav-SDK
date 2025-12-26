import { type ExecutionObject, type PlanStep } from "./execution";
import { type ExecutionError } from "./error";
// Request API types
export interface SessionCreationRequest {
    clientId: string; // this is per client. Like one website will have one unique client id
}

export interface CreateTaskRequest {
    sessionId: string;
    taskId: string;
    transcription: string;
}

export interface ExecuteWorkerRequest {
    sessionId: string;
    taskId: string;
    stepIndex: number;
    planStep: PlanStep;
}

export interface RetryErrorRequest {
    sessionId: string;
    taskId: string;
    stepIndex: number;
    errorObject: ExecutionError;
}




// Response API types
export interface SessionCreationResponse {
    sessionId: string;
    expiry: string;
}

export interface CreateTaskResponse {
    sessionId: string;
    taskId: string;
    updatedExpiry: string;
    executionPipeline: PlanStep[];
}

export type ExecuteWorkerSuccessResponse = {
    executionObject: ExecutionObject;
}

export type ExecuteWorkerErrorResponse = {
    errorObject: ExecutionError;
};

export type ExecuteWorkerResponse = {
    kind: "success";
    sessionId: string;
    taskId: string;
    stepIndex: number;
    executionObject: ExecutionObject;
} | {
    kind: "error";
    sessionId: string;
    taskId: string;
    stepIndex: number;
    errorObject: ExecutionError;
};
