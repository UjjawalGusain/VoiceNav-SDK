import { ExecutionObject, Target, Scroll, Read, Input } from "../types/execution";
import { VDomHandler } from "./VDomHandler";

export default class Executor {

    private vdom: VDomHandler;
    private synth: SpeechSynthesis;

    constructor(vdom: VDomHandler) {
        this.vdom = vdom;
        this.synth = window.speechSynthesis;
    }

    private resolveSingleTarget(target: Target): HTMLElement | null {
        let el: HTMLElement | null = null;

        switch (target.strategy) {
            case "id":
                el = this.vdom.getElementByVNodeId(target.value);
                break;

            case "css":
                el = document.querySelector(target.value) as HTMLElement | null;
                break;

            case "aria":
                // e.g -> aria-label=Submit
                const [attr, val] = target.value.split("=");
                el = document.querySelector(
                    `[${attr}="${val}"]`
                ) as HTMLElement | null;
                break;

            case "xpath": {
                const result = document.evaluate(
                    target.value,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );

                el = result.singleNodeValue as HTMLElement | null;
                break;
            }

            case "relative":
                el = this.resolveRelative(target.value);
                break;

            default:
                throw new Error(`Unknown target strategy: ${target.strategy}`);
        }

        return el;
    }

    private resolveRelative(value: string): HTMLElement | null {
        const parts = Object.fromEntries(
            value.split("|").map(p => p.split("="))
        );

        const anchor = Array.from(document.querySelectorAll("*"))
            .find(el => el.textContent?.trim() === parts.text) as HTMLElement | undefined;

        if (!anchor) return null;

        switch (parts.next) {
            case "button":
                return anchor.nextElementSibling as HTMLElement | null;

            case "parent":
                return anchor.parentElement as HTMLElement | null;

            case "child":
                return anchor.querySelector("*") as HTMLElement | null;

            default:
                return null;
        }
    }

    resolveTargets(targets: Target[]): HTMLElement[] {
        const elements: HTMLElement[] = [];

        for (const target of targets) {
            const el = this.resolveSingleTarget(target);
            if (el) elements.push(el);
        }

        return elements;
    }

    click(targets: Target[]): void {
        if (targets.length > 1) {
            throw new Error("Executor: more than 1 target for click action");
        }

        const elements = this.resolveTargets(targets);

        const el = elements[0];
        el.click();
    }

    input(targets: Target[], action: Input) {
        if (targets.length > 1) {
            throw new Error("Executor: more than 1 target for input action");
        }
        const elements = this.resolveTargets(targets);
        const el = elements[0] as HTMLInputElement;

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        if (el) el.value = action.text;
    }

    private formatText(text: string): string {
        return text
            .replace(/\./g, ". ")
            .replace(/,/g, ", ")
            .replace(/ and /g, ". ")
            .replace(/\s+/g, " ")
            .trim();
    }

    async read(action: Read) {
        const utter = new SpeechSynthesisUtterance(
            this.formatText(action.content)
        );

        const preferredVoices = [
            "Google US English",
            "Microsoft Aria Online (Natural)",
            "Microsoft Guy Online (Natural)",
            "Google UK English Male"
        ];

        const voices = await new Promise<SpeechSynthesisVoice[]>(resolve => {
            const v = this.synth.getVoices();
            if (v.length) return resolve(v);

            this.synth.onvoiceschanged = () => {
                resolve(this.synth.getVoices());
            };
        });

        utter.voice =
            voices.find(v => preferredVoices.includes(v.name)) ||
            voices.find(v => v.lang.startsWith("en")) ||
            voices[0];

        utter.rate = 1;
        utter.pitch = 0.5;
        utter.volume = 1;

        this.synth.cancel();
        this.synth.speak(utter);
    }

    stopSpeech() {
        if (this.synth.speaking || this.synth.pending) {
            this.synth.cancel(); // immediately stops any speaking or queued utterances
        }
    }

    scroll(action: Scroll) {
        window.scrollBy({
            left: action.direction.x,
            top: action.direction.y,
            behavior: "smooth",
        });
    }

    async execute(execution: ExecutionObject) {
        const targets = execution.targets;

        switch (execution.action.type) {
            case "click":
                this.click(targets);
                break;

            case "input":
                this.input(targets, execution.action);
                break;

            case "scroll":
                this.scroll(execution.action);
                break;

            case "read":
                this.read(execution.action);
                break;

            default:
                throw new Error(
                    `Executor: unsupported action`
                );
        }
    };
};
