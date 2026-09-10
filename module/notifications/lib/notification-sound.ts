let audioContext: AudioContext | null = null;

/**
 * Plays a short two-tone chime via the Web Audio API. No audio asset needed,
 * and this works the same in a browser tab and inside the Capacitor webview —
 * used for foreground push notifications, where the OS won't play a sound itself.
 */
export const playNotificationSound = () => {
  try {
    if (typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext ??= new AudioContextClass();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    [880, 1320].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.12;

      oscillator.type = "sine";
      oscillator.frequency.value = freq;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });
  } catch (error) {
    console.error("❌ Failed to play notification sound:", error);
  }
};
