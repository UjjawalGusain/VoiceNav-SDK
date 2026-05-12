# @voicenav/sdk

VoiceNav is a browser-based voice automation SDK that enables users to control websites using natural language commands. It combines speech recording, wake-word detection, virtual DOM analysis, backend task orchestration, and browser automation into a single, easy-to-integrate package.

---

## Features

- 🎙️ Voice recording using the browser MediaRecorder API
- 🗣️ Wake-word detection with Picovoice Porcupine ("Hey VoiceNav")
- 📝 Speech-to-text transcription via backend API
- 🌐 Live virtual DOM snapshot generation
- 🤖 Backend-driven task planning using DAG workflows
- 🖱️ Browser automation (click, input, scroll, text-to-speech)
- 💬 Built-in floating chat UI
- 💾 Session persistence across page reloads
- ⏹️ Stop active tasks at any time

---

## Installation

```bash
npm install @voicenav/sdk
```

## Prerequisites

Before using the SDK, you need:

- A running VoiceNav backend server.
- A DAG definition URL that describes task execution workflows.
- A Picovoice Porcupine access key (optional, required only for wake-word detection).

Get your Porcupine access key from:
https://console.picovoice.ai/

## Quickstart

```typescript
import { VoiceNavClient } from "@voicenav/sdk";
import { getButton } from "@voicenav/sdk/frontend/button";

const voiceNav = new VoiceNavClient({
  dagUrl: "https://your-server.com/dag.json",
  porcupineAccessKey: "YOUR_PORCUPINE_ACCESS_KEY",
});

// Expose globally so the chat UI can access it
(window as any).voiceNav = voiceNav;

// Create floating VoiceNav button and chat UI
getButton(voiceNav);

// Request microphone permission
await voiceNav.requestMicPermission();

// Initialize wake-word detection
await voiceNav.initWakeWord(() => {
  console.log("Wake word detected!");
});
```

### VoiceNavClient

The main SDK entry point.

#### Responsibilities:

- Requests microphone permissions
- Records audio
- Sends recordings for transcription
- Initializes wake-word detection
- Starts and stops tasks
- Restores previous sessions


### Configuration

|Option|	Required|	Description|
| -------- | -------- | -------- |
|dagUrl|	Yes	|URL of your VoiceNav DAG/workflow definition|
|porcupineAccessKey|	No*	|Picovoice access key for wake-word detection|

* Required only if you want users to say "Hey VoiceNav".

### Public API
```typescript
voiceNav.requestMicPermission();
voiceNav.initWakeWord(onWake);
voiceNav.startTask("Search for laptops");
voiceNav.startRecording();
voiceNav.stopRecording();
voiceNav.stop();
voiceNav.getState();
```

### Built-In UI

VoiceNav ships with a ready-to-use interface that includes:

- Floating launcher button
- Chatbox
- Voice recording button
- Task progress messages
- Stop Task button

### Requirements
- A VoiceNav backend server
- Modern browser with:
    - MediaRecorder
    - SpeechSynthesis
    - MutationObserver

### Recommended browser:
Google Chrome


Note - Firefox and Edge speaker might sound different.
