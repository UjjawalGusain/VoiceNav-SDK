export interface ActionCondition {
    type: "click" | "input" | "submit" | "read" | "scroll";
}


export interface DomCondition {
    selector: string;
}


export interface RouteCondition {
    pattern: string;
    match?: "exact" | "prefix" | "regex";
}


export interface PolicyCondition {
    route?: RouteCondition;
    dom?: DomCondition;
    action?: ActionCondition;
}

export interface PolicyEnforcement {
    allow?: boolean;

    sanitizeInput?: {
        mask?: boolean;
        allowPatterns?: string[];
        denyPatterns?: string[];
    };

    denyReason?: string;
}

export interface PolicyRule {
    id: string;
    description?: string;

    when: PolicyCondition;
    enforce: PolicyEnforcement;
}

export interface DefaultPolicy {
    allow: boolean;
    sanitizeInput?: {
        mask?: boolean;
        strategy?: "full" | "partial" | "hash";
    };
    denyReason?: string;
}

export interface ClientConfig {
    policies: PolicyRule[];
    defaults?: DefaultPolicy;
}
