type Click = {
    type: "click",
}

type Input = {
    type: "input",
    payload: {
        value: string;
        clearBefore: boolean;
    }
}

type Read = {
    type: "read",
    payload: {
        context: string;
    }
}

type Scroll = {
    type: "scroll",
    payload: {
        x: number;
        y: number;
    }
}


type Action = Click | Input | Read | Scroll;

type Target = {
    strategy: "id" | "css" | "xpath" | "aria" | "relative";
    value: string;
};

type Constraints = {
    mustBeVisible?: boolean;
    timeoutMs?: number;
    retries?: number;
};


export interface ExecutionObject {
    id: string;
    sessionId: string;
    stepIndex: number;

    action: Action;

    target: Target[];

    constraints?: Constraints;
}


type PlanStepKind = "reach"        // move to a page or component
    | "operate"      // perform an operation in that context
    | "extract"      // read or collect information
    | "verify";      // confirm state or outcome


export type PlanStep = {
    id: string;
    kind: PlanStepKind;

    intent: string;
    target?: {
        nodeId: string;          // DAG ndoe
        role?: "page" | "component";
    };

    operation?: {
        name: string; // like submit-form, click-like
        parameters?: Record<string, unknown>;
    };

    preconditions?: string[];
    postconditions?: string[];
    recoverable?: boolean;
};


