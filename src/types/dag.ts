type TransitionType = "soft" | "hard";

type DagEdge = {
    label: string;
    target: string;
    transition: TransitionType;
}

type NodeType = "component" | "page";

type RouteHint = {
    pattern: string;             // /user/:id
    match?: "exact" | "prefix" | "regex";
};

type DomHints = {
    mustContain?: string[];      // CSS selectors
    mustNotContain?: string[];
};

type DagNode = {
    id: string;
    type: NodeType;
    title: string;
    edges?: DagEdge[];
    routeHint?: RouteHint;
    domHints?: DomHints;
    description?: string;
}

export interface Dag {
    id: string;
    version: string;
    description: string;
    nodes: DagNode[];
}
