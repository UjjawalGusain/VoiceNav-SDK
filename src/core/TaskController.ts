import SessionManager from "./Session";
import { APIS } from "./../apis/apis";
import Executor from "./Executor";
import { addMessage, removeMessage } from "../frontend/chatbox";

class TaskController {
    private sessionManager: SessionManager;
    private dagUrl: string;
    public executor: Executor; 

    constructor(config: { sessionManager: SessionManager, dagUrl: string }) {
        this.sessionManager = config.sessionManager;
        this.dagUrl = config.dagUrl;
        this.executor = null as any;
    }


    async start(transcription: string): Promise<void> {
        const sessionId = crypto.randomUUID();
        const taskId = crypto.randomUUID();

        const currentRoute = window.location.pathname;

        const res = await fetch(APIS.CREATE_TASK, {
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
        const vdomHandler = this.sessionManager.getVDomHandler();
        this.executor = new Executor(vdomHandler);

        console.log("We are taking a step now")
        // console.log(this.sessionManager);
        //
        while (this.sessionManager.isActive()) {
            await this.step();
        }

        removeMessage("processing");
        addMessage("bot", "Task completed"); 
    }

    step = async () => {

        if (!this.sessionManager.isActive()) {
            throw new Error("Step called with no active session");
        }


        const { sessionId, taskId, stepIndex } = this.sessionManager.getSessionIdentifiers();
        const vdom = this.sessionManager.getVDOM();

        const res = await fetch(APIS.EXECUTE_STEP, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId,
                taskId,
                stepIndex,
                vdom
            }),
        });

        const data = await res.json();

        console.log("Data: ", data);

        if (data.kind === "success") {
            if (!this.executor) {
                throw new Error("Executor not initialized");
            }

            await this.executor.execute(data.executionObject);
            this.sessionManager.advanceStep();
            return;
        }


        if (data.kind === "completed") {
            this.sessionManager.endSession();
            return;
        }

        if (data.kind === "error") {
            this.sessionManager.failSession(data.error.message);
            return;
        }

    }

    stop = async () => {
        this.executor?.stopSpeech();
        console.log("This session: ")
        console.log(this.sessionManager.isActive());

        if (this.sessionManager.isActive()) {
            console.log("Yeah session has ended - 1");
            this.sessionManager.endSession();
            console.log("Yeah session has ended - 2");
        }
    }

}

export default TaskController;

