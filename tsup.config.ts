import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",

  bundle: true,
  noExternal: [
    "@picovoice/porcupine-web",
    "@picovoice/web-voice-processor",
    "edge-tts-universal"
  ],
});
