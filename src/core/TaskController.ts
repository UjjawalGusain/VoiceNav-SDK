import SessionManager from "./Session";

class TaskController {
    private sessionManager: SessionManager;
    private apiBaseUrl: string;
    private dagUrl: string;

    constructor(config: { apiBaseUrl: string, sessionManager: SessionManager, dagUrl: string }) {
        this.sessionManager = config.sessionManager;
        this.apiBaseUrl = config.apiBaseUrl;
        this.dagUrl = config.dagUrl;
    }


    async start(transcription: string): Promise<void> {
        const sessionId = crypto.randomUUID();
        const taskId = crypto.randomUUID();

        const currentRoute = window.location.pathname;

        const res = await fetch(`${this.apiBaseUrl}/execution/task/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId,
                taskId,
                transcription,
                dagUrl: this.dagUrl,
                currentRoute,
            }),
        });

        const data = await res.json();

        if (data.kind === "error") {
            this.sessionManager.failSession(data.error.message);
            throw new Error(data.error.message);
        }

        this.sessionManager.startSession(sessionId, taskId);
    }

    step = async () => {

    }

    stop = async () => {

    }

}

export default TaskController;

