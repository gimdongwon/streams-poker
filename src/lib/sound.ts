import { useSettingsStore } from "@/stores/settingsStore";

export type SoundName = "place" | "warning" | "reveal" | "win" | "click";

let audioCtx: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;

  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext;

  if (!Ctor) return null;

  if (!audioCtx) {
    audioCtx = new Ctor();
  }

  // Mobile autoplay policy: resume if the context was suspended.
  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {});
  }

  return audioCtx;
};

/**
 * Play a single tone with a short attack/decay envelope to avoid clicks.
 * `start` is an offset (seconds) from the context's current time so notes
 * can be chained into simple sequences.
 */
const playTone = (
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gain: number,
  type: OscillatorType = "sine"
): void => {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  const attack = 0.008;
  const release = Math.max(0.02, duration - attack);

  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);

  osc.connect(env);
  env.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
};

export const playSound = (name: SoundName): void => {
  try {
    if (useSettingsStore.getState().muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    switch (name) {
      case "place":
        // short blip
        playTone(ctx, 660, 0, 0.08, 0.1, "triangle");
        break;
      case "warning":
        // higher beep for the final seconds of the timer
        playTone(ctx, 880, 0, 0.12, 0.1, "square");
        break;
      case "reveal":
        // soft two-note
        playTone(ctx, 520, 0, 0.1, 0.08, "sine");
        playTone(ctx, 700, 0.1, 0.14, 0.08, "sine");
        break;
      case "win":
        // ascending arpeggio
        playTone(ctx, 523.25, 0, 0.1, 0.09, "triangle");
        playTone(ctx, 659.25, 0.09, 0.1, 0.09, "triangle");
        playTone(ctx, 783.99, 0.18, 0.16, 0.1, "triangle");
        break;
      case "click":
        // very short tick
        playTone(ctx, 440, 0, 0.04, 0.06, "sine");
        break;
    }
  } catch {
    // Never let audio failures break gameplay.
  }
};
