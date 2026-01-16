export type VNodeTag = string | "TEXT";

export interface Actionability {
    click?: boolean;
    type?: boolean;
    select?: boolean;
    navigate?: boolean;
}

export interface VNodeAttributes {
    [key: string]: string;
}

export interface VNodeOptions {
    attrs?: VNodeAttributes;
    children?: VNode[];
    text?: string | null;
    actionability?: Actionability;
}

export interface VNode {
    nodeId: string;
    tagName: VNodeTag;
    options: VNodeOptions;
    parentNode: VNode | null;
}

export interface SafeVNode {
    nodeId: string;
    tagName: VNodeTag;
    options:
        | { text: string | null }
        | {
              attrs: Readonly<VNodeAttributes>;
              children: ReadonlyArray<SafeVNode>;
              actionability?: Readonly<Actionability>;
          };
}



export interface VDomSnapshot {
    root: SafeVNode | null;
}

export interface VDomHandlerOptions {
    ignoreClass?: string;
}


export interface PageContext {
    url: string;
    route: string;
}

export interface VDomPayload {
    page: PageContext;
    vdom: SafeVNode | null;
}
