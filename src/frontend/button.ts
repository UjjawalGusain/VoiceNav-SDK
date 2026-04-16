import { VoiceNavClient } from "../core/Client";
import {
    createChatbox,
    showChatbox,
    hideChatbox,
    isChatboxVisible,
} from "./chatbox";

export function getButton(client: VoiceNavClient) {
    if (document.getElementById("voicenav-button")) return;
    const button = document.createElement("button");
    button.type = "button";

    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.width = "50px";
    button.style.height = "50px";
    button.style.borderRadius = "50%";
    button.style.border = "3px solid #4A90E2";
    button.style.backgroundColor = "white";
    button.style.cursor = "pointer";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    button.style.zIndex = "9999";
    button.style.padding = "0";
    button.classList.add("voicenav-vnode-ignore");

    const img = document.createElement("img");
    img.src = "https://storage.googleapis.com/voice_recording_bucket/icon.png";
    img.alt = "VoiceNav Icon";
    img.style.width = "50px";
    img.style.height = "50px";
    img.style.pointerEvents = "none";

    button.appendChild(img);
    document.body.appendChild(button);

    const chatbox = createChatbox();

    const input = chatbox.querySelector<HTMLInputElement>("#voicenav-input")!;
    const sendBtn = chatbox.querySelector<HTMLButtonElement>("#voicenav-send")!;
    const messages = chatbox.querySelector<HTMLDivElement>("#voicenav-messages")!;

    const appendMessage = (text: string, fromUser = true) => {
        const msg = document.createElement("div");
        msg.textContent = text;
        msg.style.margin = "4px 0";
        msg.style.textAlign = fromUser ? "right" : "left";
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    };

    const handleSend = async () => {
        const transcript = input.value.trim();
        if (!transcript) return;

        appendMessage(transcript, true); 
        input.value = "";

        try {
            await client.startTask(transcript);
            appendMessage("Task started…", false);
        } catch (err: any) {
            appendMessage(`Error: ${err.message}`, false);
        }
    };

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSend();
    });

    button.addEventListener("click", () => {
        isChatboxVisible(chatbox)
            ? hideChatbox(chatbox)
            : showChatbox(chatbox);
    });

    console.log("VoiceNav initialized");
}
