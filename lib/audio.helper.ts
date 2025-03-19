// TypeScript declaration to make the global window.audioElement available
declare global {
  interface Window {
    audioElement: HTMLAudioElement | null;
  }
}

// Initialize or get the audio element
export function getAudioElement(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    throw new Error('Audio can only be used in browser environment');
  }

  if (!window.audioElement) {
    window.audioElement = new Audio();
    window.audioElement.loop = true;
  }

  return window.audioElement;
}

// Play a sound
export function playSound(soundUrl: string, volume: number = 0.7): void {
  const audio = getAudioElement();

  // If already playing, stop first
  if (!audio.paused) {
    audio.pause();
  }

  audio.src = soundUrl;
  audio.volume = volume;

  audio.play().catch((err) => {
    console.error('Error playing audio:', err);
  });
}

// Stop the currently playing sound
export function stopSound(): void {
  if (typeof window === 'undefined' || !window.audioElement) return;

  window.audioElement.pause();
}

// Update volume
export function setVolume(volume: number): void {
  if (typeof window === 'undefined' || !window.audioElement) return;

  window.audioElement.volume = Math.min(1, Math.max(0, volume / 100));
}
