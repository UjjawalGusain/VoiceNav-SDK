import { VoiceNavClient } from "../core/Client";

export function createChatbox() {
    const existing = document.getElementById("voicenav-chatbox");
    if (existing) return existing as HTMLElement;

    const container = document.createElement("div");
    container.id = "voicenav-chatbox";
    container.classList.add("voicenav-vnode-ignore");

    container.style.position = "fixed";
    container.style.bottom = "90px";
    container.style.right = "20px";
    container.style.width = "400px";
    container.style.height = "440px";
    container.style.background = "white";
    container.style.borderRadius = "12px";
    container.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.zIndex = "9999";
    container.style.overflow = "hidden";

    // animation
    container.style.transformOrigin = "bottom right";
    container.style.transform = "scale(0)";
    container.style.opacity = "0";
    container.style.transition = "transform 0.25s ease, opacity 0.25s ease";
    container.style.pointerEvents = "none";

    // inner HTML
    container.innerHTML = `
        <!-- header -->
        <div style="
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #eee;
            font-weight: 600;
        ">
            <span style="color: black;">Just say "Hey VoiceNav" and talk to me</span>
            <button id="voicenav-back" style="
                border: none;
                background: transparent;
                font-size: 18px;
                cursor: pointer;
            ">←</button>
        </div>

        <!-- messages -->
        <div id="voicenav-messages" style="
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            font-size: 14px;
        "></div>

        <!-- input area -->
        <div style="
            padding: 10px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 6px;
            align-items: center;
        ">
            <input
                id="voicenav-input"
                type="text"
                placeholder="Say or type a command…"
                style="
                    flex: 1;
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                    color: black;
                    outline: none;
                "
            />
            <button id="voicenav-record" title="Press to record" style="
                width: 44px;
                height: 44px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 20px;
            ">
                🎤
            </button>
            <button id="voicenav-send" title="Send command" style="
                width: 60px;
                height: 44px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                justify-content: center;
                align-items: center;
            ">Send</button>
        </div>
    `;

    document.body.appendChild(container);

    const input = container.querySelector("#voicenav-input") as HTMLInputElement;
    const sendBtn = container.querySelector("#voicenav-send") as HTMLButtonElement;
    const recordBtn = container.querySelector("#voicenav-record") as HTMLButtonElement;

    const voiceNav = (window as any).voiceNav as VoiceNavClient;

    // record button color based on recording
    recordBtn.style.background = voiceNav?.isRecording ? "#dc3545" : "#28a745";

    recordBtn.addEventListener("click", async () => {
        if (!voiceNav) return;

        if (voiceNav.isRecording) {
            await voiceNav.stopRecording();
            recordBtn.style.background = "#28a745";
        } else {
            await voiceNav.stopWakeWord(); // optional
            await voiceNav.startRecording();
            recordBtn.style.background = "#dc3545";
        }
    });

    const send = () => {
        const value = input.value.trim();
        if (!value) return;

        addMessage("user", value);
        input.value = "";
        voiceNav?.startTask(value);
    };

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            send();
        }
    });

    sendBtn.addEventListener("click", send);

    // back button behavior
    container.querySelector("#voicenav-back")!.addEventListener("click", () => {
        hideChatbox(container);
    });

    return container;
}

export function addStopButtonMessage(id: string) {
    const container = document.getElementById("voicenav-messages");
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.id = id;
    wrapper.style.marginBottom = "8px";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "flex-start";

    const button = document.createElement("button");
    button.innerText = "⏹ Stop Task";
    button.style.padding = "6px 12px";
    button.style.borderRadius = "6px";
    button.style.border = "none";
    button.style.background = "#dc3545";
    button.style.color = "white";
    button.style.cursor = "pointer";
    button.style.fontSize = "13px";

    // Stop action
    button.addEventListener("click", async () => {
        const voiceNav = (window as any).voiceNav as VoiceNavClient;
        if (!voiceNav) return;

        // Stop the ongoing task completely
        await voiceNav.stop();

        // Stop recording if active
        if (voiceNav.isRecording) {
            await voiceNav.stopRecording();
        }

        // Stop wake-word if active
        await voiceNav.stopWakeWord();

        addMessage("system", "Task has been stopped.");
        wrapper.remove(); // optional: remove stop button after use
    });

    wrapper.appendChild(button);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

// ----- message functions -----

export function addMessage(role: "user" | "bot" | "system", text: string) {
    const container = document.getElementById("voicenav-messages");
    if (!container) return;

    const message = document.createElement("div");
    message.style.marginBottom = "8px";
    message.style.display = "flex";
    message.style.justifyContent = role === "user" ? "flex-end" : "flex-start";

    const bubble = document.createElement("div");
    bubble.innerText = text;
    bubble.style.padding = "8px 12px";
    bubble.style.borderRadius = "10px";
    bubble.style.maxWidth = "80%";
    bubble.style.fontSize = "13px";
    bubble.style.lineHeight = "1.4";

    if (role === "user") {
        bubble.style.background = "#007bff";
        bubble.style.color = "white";
    } else if (role === "bot") {
        bubble.style.background = "#f1f1f1";
        bubble.style.color = "black";
    } else {
        bubble.style.background = "transparent";
        bubble.style.color = "#888";
        bubble.style.fontSize = "12px";
    }

    message.appendChild(bubble);
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}

export function addLoadingMessage(id: string, text: string) {
    const container = document.getElementById("voicenav-messages");
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.id = id;
    wrapper.style.marginBottom = "8px";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "flex-start";

    const bubble = document.createElement("div");
    bubble.innerText = text + " ⏳";
    bubble.style.padding = "8px 10px";
    bubble.style.borderRadius = "10px";
    bubble.style.background = "#f1f1f1";
    bubble.style.color = "black";
    bubble.style.fontSize = "13px";

    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

export function addListeningMessage(id: string, text: string) {
    const container = document.getElementById("voicenav-messages");
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.id = id;
    wrapper.style.marginBottom = "8px";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "flex-start";

    const bubble = document.createElement("div");
    bubble.innerText = text + " 🎙️";
    bubble.style.padding = "8px 10px";
    bubble.style.borderRadius = "10px";
    bubble.style.background = "#f1f1f1";
    bubble.style.color = "black";
    bubble.style.fontSize = "13px";

    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

export function removeMessage(id: string) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ----- chatbox visibility -----

export function showChatbox(chatbox: HTMLElement) {
    chatbox.style.pointerEvents = "auto";
    chatbox.style.transform = "scale(1)";
    chatbox.style.opacity = "1";
}

export function hideChatbox(chatbox: HTMLElement) {
    chatbox.style.pointerEvents = "none";
    chatbox.style.transform = "scale(0)";
    chatbox.style.opacity = "0";
}

export function isChatboxVisible(chatbox: HTMLElement): boolean {
    return chatbox.style.opacity === "1";
}
