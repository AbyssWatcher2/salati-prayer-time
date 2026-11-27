import type { SoundChoice } from '../types/prayer';

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  return sharedCtx;
}

export async function unlockAudio(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  gainPeak: number,
  type: OscillatorType = 'sine',
) {
  const now = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export async function playReminderSound(choice: SoundChoice): Promise<void> {
  if (choice === 'silent') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (choice === 'adhan-chime') {
      // Hijaz-inspired warm chime phrase (D4 -> Eb4 -> F#4 -> G4 -> D5)
      playTone(ctx, 293.66, 0.0, 0.45, 0.16, 'triangle');
      playTone(ctx, 311.13, 0.35, 0.45, 0.16, 'triangle');
      playTone(ctx, 369.99, 0.70, 0.55, 0.18, 'sine');
      playTone(ctx, 392.0, 1.15, 0.70, 0.20, 'sine');
      playTone(ctx, 587.33, 1.60, 0.85, 0.15, 'sine');
    } else if (choice === 'gentle') {
      playTone(ctx, 523.25, 0.0, 0.45, 0.14, 'sine');
      playTone(ctx, 659.25, 0.32, 0.65, 0.16, 'sine');
    } else if (choice === 'strong') {
      playTone(ctx, 783.99, 0.0, 0.25, 0.22, 'triangle');
      playTone(ctx, 880.0, 0.28, 0.25, 0.22, 'triangle');
      playTone(ctx, 987.77, 0.56, 0.55, 0.25, 'triangle');
    }
  } catch {
    // Audio playback blocked before user gesture; fail gracefully
  }
}
