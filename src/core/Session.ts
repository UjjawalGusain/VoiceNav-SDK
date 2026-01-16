import { SDKState } from "../types/session";
import { VDomHandler } from "./VDomHandler";

export function startVDomSession(options?: {
  root?: HTMLElement;
  intervalMs?: number;
}) {
  console.log("Vdom started - 1");
  const root = options?.root ?? document.body;
  console.log(root)
  const intervalMs = options?.intervalMs ?? 20_000;
  console.log(intervalMs)
  const handler = new VDomHandler(root);
  console.log(handler)
  const intervalId = window.setInterval(() => {
    const snapshot = handler.getSafeVirtualDomSnapshot();
    console.log("===== VDOM SNAPSHOT =====");
    handler.printDom(snapshot);
  }, intervalMs);

  return {
    stop() {
      clearInterval(intervalId);
    },
  };
}

class SessionManager {
    private state: SDKState = { status: "idle" };

    startSession(sessionId: string, taskId: string) {
        this.state = {
            status: "running",
            sessionId,
            taskId,
            stepIndex: 0,
        };
    }

    endSession() {
        this.state = { status: "completed" };
    }

    failSession(error: string) {
        this.state = { status: "error", error };
    }

    reset() {
        this.state = { status: "idle" };
    }


    advanceStep() {
        if (this.state.status !== "running") {
            throw new Error("No active session");
        }
        this.state = {
            ...this.state,
            stepIndex: this.state.stepIndex + 1,
        };
    }


    isActive(): boolean {
        return this.state.status === "running";
    }

    getState(): SDKState {
        return this.state;
    }

    getSessionIdentifiers(): { sessionId: string; taskId: string } {
        if (this.state.status !== "running") {
            throw new Error("No active session");
        }
        return {
            sessionId: this.state.sessionId,
            taskId: this.state.taskId,
        };
    }
}

export default SessionManager;

