import SessionManager from "./Session";
import TaskController from "./TaskController";
import { SDKState } from "../types/session";
import { PorcupineWorker } from "@picovoice/porcupine-web";
import { WebVoiceProcessor } from "@picovoice/web-voice-processor";
import { APIS } from "../apis/apis";
import { addLoadingMessage, removeMessage, addMessage, addListeningMessage, addStopButtonMessage } from "../frontend/chatbox";

export class VoiceNavClient {
    private sessionManager: SessionManager
    private taskController: TaskController
    private porcupineAccessKey: string;
    private readonly keywordPath = "/hey-voicenav.ppn";
    private readonly modelPath = "/porcupine_params.pv";
    private porcupine: PorcupineWorker | null = null;

    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;

    isRecording = false;
    private onWakeCallback: (() => void) | null = null;
    private recordingTimeout: any;

    private micGranted: boolean = false;

    constructor(config: { dagUrl: string, porcupineAccessKey: string }) {
        this.sessionManager = new SessionManager()

        this.taskController = new TaskController({
            sessionManager: this.sessionManager,
            dagUrl: config.dagUrl,
        })

        this.porcupineAccessKey = config.porcupineAccessKey;


        this.restoreSessionIfExists()
    }

    async startRecording() {
        if (this.mediaRecorder) {
            console.warn("Already recording");
            return;
        }

        if (this.isRecording) return;
        this.isRecording = true;
        addListeningMessage("recording", "Recording your voice...");

        try {
            if (!this.stream) {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.stream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();

            console.log("Recording started");

            const MAX_DURATION = 10000;
            this.recordingTimeout = setTimeout(() => this.stopRecording(), MAX_DURATION);
        } catch (err) {
            console.error("Recording failed:", err);
            this.isRecording = false;
        }
    }

    async stopRecording() {
        if (!this.mediaRecorder) return;

        return new Promise<void>((resolve) => {
            this.mediaRecorder!.onstop = async () => {
                this.isRecording = false;
                removeMessage("recording");
                const blob = new Blob(this.audioChunks, {
                    type: "audio/webm"
                });

                console.log("Recording stopped");

                // const url = URL.createObjectURL(blob);
                // const a = document.createElement("a");
                // a.href = url;
                // a.download = "recording.webm";
                // document.body.appendChild(a);
                // a.click();
                // document.body.removeChild(a);
                // URL.revokeObjectURL(url);
                //
                // console.log("Recording saved locally");

                await this.sendToBackend(blob);

                this.stream?.getTracks().forEach(track => track.stop());

                this.mediaRecorder = null;
                this.stream = null;
                this.audioChunks = [];

                resolve();
            };

            clearTimeout(this.recordingTimeout);

            this.mediaRecorder!.stop();
        });
    }

    async sendToBackend(blob: Blob) {
        console.log("Trying to send data to backend")
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");

        try {
            addLoadingMessage("transcribing", "Transcribing your voice...");
            const res = await fetch(APIS.TRANSCRIBE, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!data.text || !data.text.trim()) {
                console.warn("Empty transcript");
                if (this.onWakeCallback) {
                    await this.restartWakeWord(this.onWakeCallback);
                }
                return;
            }

            console.log("Transcribed text: ", data.text);
            removeMessage("transcribing");
            addMessage("user", data.text);

            await this.startTask(data.text);
            if (this.onWakeCallback) {
                await this.restartWakeWord(this.onWakeCallback);
            }

        } catch (err) {
            console.error("Transcription failed:", err);
            if (this.onWakeCallback) {
                await this.restartWakeWord(this.onWakeCallback);
            }
        }
    }

    async requestMicPermission(): Promise<boolean> {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micGranted = true;
            console.log("Mic permission granted");
            return true;
        } catch (err) {
            console.warn("Mic permission denied or blocked");
            this.micGranted = false;
            return false;
        }
    }

    async initWakeWord(onWake: () => void): Promise<void> {
        if (!this.porcupineAccessKey) {
            console.warn("Porcupine key missing — wake word disabled");
            return;
        }

        if (this.porcupine) {
            console.warn("Already initialized");
            return;
        }

        if (!this.micGranted) {
            console.warn("Mic not granted — skipping wake word");
            return;
        }

        this.onWakeCallback = onWake;

        try {
            this.porcupine = await PorcupineWorker.create(
                this.porcupineAccessKey,
                {
                    publicPath: this.keywordPath,
                    label: "voicenav"
                },
                (detection) => {
                    console.log("Wake word detected:", detection.label);
                    this.onWakeCallback?.();
                    this.stopWakeWord();
                    this.startRecording();
                },
                {
                    publicPath: this.modelPath
                }
            );

            console.log("Subscribing...");
            await WebVoiceProcessor.subscribe(this.porcupine);
            console.log("Subscribed successfully");

        } catch (err) {
            console.error("Porcupine init failed:", err);
        }
    }

    async stopWakeWord(): Promise<void> {
        if (!this.porcupine) return;

        try {
            // unsubscribe safely
            if (WebVoiceProcessor) {
                await WebVoiceProcessor.unsubscribe(this.porcupine);
            }

            // release safely
            if (this.porcupine.release) {
                this.porcupine.release();
            }

            // terminate safely
            if (this.porcupine.terminate) {
                this.porcupine.terminate();
            }

        } catch (err) {
            console.warn("Error stopping wake word:", err);
        } finally {
            this.porcupine = null;
            console.log("Wake word stopped");
        }
    }

    async restartWakeWord(onWake: () => void): Promise<void> {
        await this.stopWakeWord();
        await this.initWakeWord(onWake);
    }


    private restoreSessionIfExists(): void {
        const saved = sessionStorage.getItem("voicenav_session");
        if (!saved) return;

        try {
            const data = JSON.parse(saved);

            this.sessionManager.startSession(
                data.sessionId,
                data.taskId
            );

            // restore step index
            for (let i = 0; i < data.stepIndex; i++) {
                this.sessionManager.advanceStep();
            }

            console.log("VoiceNav session restored");
        } catch (err) {
            console.warn("Failed to restore VoiceNav session");
            sessionStorage.removeItem("voicenav_session");
        }
    }

    // start new task
    async startTask(transcript: string): Promise<void> {
        if (this.sessionManager.isActive()) {
            console.warn("Task already running, ignoring voice input");
            return;
        }

        addStopButtonMessage("stop-task-1");

        addLoadingMessage("processing", "Understanding your request...");

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
        this.taskController.stop();

        if (this.isRecording) {
            this.stopRecording();
        }

        this.stopWakeWord();
    }

    // get current sdk state => {"idle", "running"+step, "completed", "error"+error}
    getState(): SDKState {
        return this.sessionManager.getState()
    }

}
