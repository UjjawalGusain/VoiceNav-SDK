import { SDKState } from "../types/session";
import { VDomHandler } from "./VDomHandler";
import { SafeVNode } from "../types/vdom";

class SessionManager {
    private state: SDKState = { status: "idle" };
    private vdomStopper: (() => void) | null = null;
    private vdomHandler: VDomHandler | null = null;


    startSession(sessionId: string, taskId: string) {
        if (this.state.status === "running") {
            throw new Error("Session already active");
        }

        this.state = {
            status: "running",
            sessionId,
            taskId,
            stepIndex: 0,
        };

        sessionStorage.setItem(
            "voicenav_session",
            JSON.stringify({ sessionId, taskId, stepIndex: 0 })
        );

        this.startVDom();
        console.log("Vdom has started")
    }


    private startVDom(options?: { root?: HTMLElement; intervalMs?: number }) {
        console.log("We are here");
        const root = options?.root ?? document.body;

        this.vdomHandler = new VDomHandler(root);

        this.vdomStopper = () => {
            this.vdomHandler = null;
        };
    }


    endSession() {
        this.stopVDom();
        this.state = { status: "completed" };

        sessionStorage.removeItem("voicenav_session");
    }

    failSession(error: string) {
        this.stopVDom();
        this.state = { status: "error", error };

        sessionStorage.removeItem("voicenav_session");
    }

    reset() {
        this.stopVDom();
        this.state = { status: "idle" };

        sessionStorage.removeItem("voicenav_session");
    }

    private stopVDom() {
        if (this.vdomStopper) {
            this.vdomStopper();
            this.vdomHandler?.disconnect();
            this.vdomStopper = null;
        }
    }

    advanceStep() {
        if (this.state.status !== "running") {
            throw new Error("No active session");
        }
        this.state = {
            ...this.state,
            stepIndex: this.state.stepIndex + 1,
        };

        sessionStorage.setItem(
            "voicenav_session",
            JSON.stringify({
                sessionId: this.state.sessionId,
                taskId: this.state.taskId,
                stepIndex: this.state.stepIndex
            })
        );
    }

    isActive(): boolean {
        return this.state.status === "running";
    }

    getState(): SDKState {
        return this.state;
    }

    getSessionIdentifiers(): { sessionId: string; taskId: string, stepIndex: number } {
        if (this.state.status !== "running") {
            throw new Error("No active session");
        }
        return {
            sessionId: this.state.sessionId,
            taskId: this.state.taskId,
            stepIndex: this.state.stepIndex,
        };
    }

    getVDomHandler(): VDomHandler {
        if (!this.vdomHandler) {
            throw new Error("VDOM not initialized");
        }
        return this.vdomHandler;
    }


    getVDOM(): SafeVNode | null {
        if (this.state.status !== "running") {
            return null;
        }
        return this.vdomHandler?.getSafeVirtualDomSnapshot() ?? null;
    }

}

export default SessionManager;
