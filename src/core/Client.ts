import SessionManager from "./Session";
import TaskController from "./TaskController";
import { SDKState } from "../types/session";


export class VoiceNavClient {
    private sessionManager: SessionManager
    private taskController: TaskController

    constructor(config: { apiBaseUrl: string, dagUrl: string }) {
        this.sessionManager = new SessionManager()
        this.taskController = new TaskController({
            apiBaseUrl: config.apiBaseUrl,
            sessionManager: this.sessionManager,
            dagUrl: config.dagUrl,
        })
    }

    // start new task
    async startTask(transcript: string): Promise<void> {
        if (this.sessionManager.isActive()) {
            throw new Error("A task is already running")
        }

        await this.taskController.start(transcript)
    }

    // move next step of the execution pipeline
    async step(): Promise<void> {
        if (!this.sessionManager.isActive()) {
            throw new Error("No active task")
        }

        await this.taskController.step()
    }

    // stop session
    stop(): void {
        this.taskController.stop()
    }

    // get current sdk state => {"idle", "running"+step, "completed", "error"+error}
    getState(): SDKState {
        return this.sessionManager.getState()
    }

}
