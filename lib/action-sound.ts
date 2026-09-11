let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;

  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
};

const playTone = (
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  peakGain: number,
) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
};

/**
 * Single short "tick" played after a mutating request (create/update/delete)
 * completes successfully. Uses the Web Audio API so no sound asset is needed.
 */
export const playActionSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    playTone(ctx, 1000, now, 0.06, "sine", 0.25);
  } catch (error) {
    console.error("❌ Failed to play action success sound:", error);
  }
};

/**
 * Short descending buzz played after a mutating request (create/update/delete)
 * fails. Uses the Web Audio API so no sound asset is needed.
 */
export const playActionErrorSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [220, 160].forEach((freq, i) => {
      playTone(ctx, freq, now + i * 0.11, 0.2, "triangle", 0.22);
    });
  } catch (error) {
    console.error("❌ Failed to play action error sound:", error);
  }
};
