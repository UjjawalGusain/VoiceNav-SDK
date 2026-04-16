let NODE_ID_SEQ = 0;
const generateNodeId = () => `vn_${++NODE_ID_SEQ}`;

import type { VNode, SafeVNode, Actionability } from "../types/vdom";

export class VDomHandler {
    #root: HTMLElement;
    #domToVNodeMap: WeakMap<Node, VNode>;
    #virtualDom: VNode | null;
    #observerOptions: MutationObserverInit;
    #mutationObserver: MutationObserver;
    #nodeIdToElement: Map<string, HTMLElement>;

    constructor(root: HTMLElement) {
        this.#root = root;
        this.#domToVNodeMap = new WeakMap();
        this.#nodeIdToElement = new Map();

        this.#observerOptions = {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
        };

        this.#virtualDom = this._buildVirtualDom(this.#root, null);
        this.#mutationObserver = new MutationObserver(this._mutationCallback);
        this.#mutationObserver.observe(this.#root, this.#observerOptions);
    }

    private _inferActionability(el: HTMLElement): Actionability {
        const tag = el.tagName.toLowerCase();

        return {
            click:
                tag === "button" ||
                tag === "a" ||
                el.onclick !== null ||
                el.getAttribute("role") === "button",

            type:
                tag === "input" ||
                tag === "textarea" ||
                el.isContentEditable === true,

            select: tag === "select",

            navigate: tag === "a" && el.hasAttribute("href"),
        };
    }



    _createVNode(root: Node, parent: VNode | null = null): VNode {
        const id = generateNodeId();
        if (root.nodeType === Node.TEXT_NODE) {
            return {
                nodeId: id,
                tagName: "TEXT",
                options: { text: root.textContent },
                parentNode: parent,
            };
        }

        if (!(root instanceof HTMLElement)) {
            // Non-element node (comment, document fragment, etc.)
            return {
                nodeId: id,
                tagName: "UNKNOWN",
                options: { children: [] },
                parentNode: parent,
            };
        }

        const el = root; // now SAFE

        const vNode: VNode = {
            nodeId: id,
            tagName: el.tagName,
            options: {
                children: [],
                attrs: {},
                actionability: this._inferActionability(el),
            },
            parentNode: parent,
        };
        this.#nodeIdToElement.set(id, el);

        for (const attr of Array.from(el.attributes)) {
            vNode.options.attrs![attr.name] = attr.value;
        }

        return vNode;
    }



    private _buildVirtualDom(root: Node, parent: VNode | null): VNode | null {
        if (
            root instanceof HTMLElement &&
            (root.tagName === "SCRIPT" || root.tagName === "STYLE" || root.classList.contains("voicenav-vnode-ignore"))
        ) {
            return null;
        }

        const vNode = this._createVNode(root, parent);
        this.#domToVNodeMap.set(root, vNode);

        if (root.hasChildNodes()) {
            for (const child of Array.from(root.childNodes)) {
                const childVNode = this._buildVirtualDom(child, vNode);
                if (childVNode) {
                    vNode.options.children!.push(childVNode);
                }
            }
        }

        return vNode;
    }

    getSafeVirtualDomSnapshot(): SafeVNode | null {
        const cloneNode = (node: VNode | null): SafeVNode | null => {
            if (!node) return null;

            if (node.tagName === "TEXT") {
                return Object.freeze({
                    nodeId: node.nodeId,
                    tagName: "TEXT",
                    options: Object.freeze({
                        text: node.options.text ?? null,
                    }),
                });
            }

            return Object.freeze({
                nodeId: node.nodeId,
                tagName: node.tagName,
                options: Object.freeze({
                    attrs: Object.freeze({ ...(node.options.attrs ?? {}) }),
                    actionability: Object.freeze({
                        ...(node.options.actionability ?? {}),
                    }),
                    children: Object.freeze(
                        (node.options.children ?? [])
                            .map(cloneNode)
                            .filter(Boolean) as SafeVNode[]
                    ),
                }),
            });
        };

        return cloneNode(this.#virtualDom);
    }


    printDom(node: SafeVNode | null, depth = 0): void {
        if (!node) return;

        const indent = "  ".repeat(depth);

        if (node.tagName === "TEXT") {
            const text = "text" in node.options ? node.options.text?.trim() : null;
            if (text) console.log(`${indent}${text}`);
            return;
        }

        let attrs = "";
        if ("attrs" in node.options) {
            for (const [k, v] of Object.entries(node.options.attrs)) {
                attrs += v === "" ? ` ${k}` : ` ${k}="${v}"`;
            }
        }

        attrs += ` data-node-id="${node.nodeId}"`;

        const children =
            "children" in node.options ? node.options.children : [];

        if (!children || children.length === 0) {
            console.log(`${indent}<${node.tagName}${attrs} />`);
            return;
        }

        console.log(`${indent}<${node.tagName}${attrs}>`);
        for (const child of children) {
            this.printDom(child, depth + 1);
        }
        console.log(`${indent}</${node.tagName}>`);
    }

    private _renderAddedNodes(addedNodes: NodeList): void {
        for (const node of Array.from(addedNodes)) {
            if (
                node instanceof HTMLElement &&
                node.classList.contains("voicenav-vnode-ignore")
            ) {
                continue;
            }

            const parent = node.parentNode;
            if (!parent) continue;

            const parentVNode = this.#domToVNodeMap.get(parent);
            if (!parentVNode || !parentVNode.options.children) continue;

            const newVNode = this._buildVirtualDom(node, parentVNode);
            if (!newVNode) continue;

            parentVNode.options.children.push(newVNode);
        }
    }

    private _renderRemovedNodes(removedNodes: NodeList): void {
        const cleanup = (node: Node) => {
            const vnode = this.#domToVNodeMap.get(node);
            if (!vnode) return;

            this.#nodeIdToElement.delete(vnode.nodeId);
            this.#domToVNodeMap.delete(node);

            if (node.hasChildNodes()) {
                node.childNodes.forEach(cleanup);
            }
        };

        for (const node of Array.from(removedNodes)) {
            const vnode = this.#domToVNodeMap.get(node);
            if (vnode?.parentNode) {
                const parent = vnode.parentNode;
                parent.options.children = parent.options.children?.filter(
                    c => c !== vnode
                );
            }

            cleanup(node);
        }
    }

    _renderAttributes(mutation: MutationRecord) {
        const domNode = mutation.target;
        const vnode = this.#domToVNodeMap.get(domNode);
        if (!vnode) return;

        // TEXT nodes should never receive attributes
        if (vnode.tagName === "TEXT") return;

        // Ensure attrs exists
        if (!vnode.options.attrs) {
            vnode.options.attrs = {};
        }

        const attrName = mutation.attributeName;
        if (!attrName) return;

        const value = (domNode as Element).getAttribute(attrName);

        if (value === null) {
            delete vnode.options.attrs[attrName];
        } else {
            vnode.options.attrs[attrName] = value;
        }
    }


    private _renderCharacterData(mutation: MutationRecord): void {
        const node = mutation.target;
        const vnode = this.#domToVNodeMap.get(node);
        if (!vnode) return;

        vnode.options.text = node.textContent;
    }

    private _mutationCallback = (mutations: MutationRecord[]): void => {
        for (const m of mutations) {
            if (m.type === "childList") {
                this._renderAddedNodes(m.addedNodes);
                this._renderRemovedNodes(m.removedNodes);
            } else if (m.type === "attributes") {
                this._renderAttributes(m);
            } else if (m.type === "characterData") {
                this._renderCharacterData(m);
            }
        }
    };

    getElementByVNodeId(nodeId: string): HTMLElement | null {
        return this.#nodeIdToElement.get(nodeId) ?? null;
    }


    disconnect() {
        this.#mutationObserver.disconnect();
    }

}
