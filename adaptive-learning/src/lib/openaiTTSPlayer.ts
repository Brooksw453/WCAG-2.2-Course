/**
 * OpenAI TTS Audio Player
 *
 * Plays MP3 audio from the /api/tts endpoint via HTMLAudioElement.
 *
 * HTMLAudioElement is used instead of AudioContext because:
 * 1. It continues playing on iOS lock screen and when switching apps
 *    (AudioContext gets suspended/interrupted by iOS Safari)
 * 2. It routes through A2DP (Bluetooth speakers, CarPlay)
 * 3. Its playbackRate uses time-stretching (natural sound) instead of
 *    pitch-shifting (chipmunk effect from AudioBufferSourceNode)
 * 4. It works with Media Session API (lock screen controls)
 *
 * Features:
 * - Pre-fetch cache: blob URLs stored by text key (max 50)
 * - Pause/resume via audio.pause()/play()
 * - Playback rate via audio.playbackRate (time-stretched, not pitch-shifted)
 * - Generation counter to prevent overlapping playback from stale callbacks
 */

const MAX_CACHE_SIZE = 50;

// Module-level silent keepalive: held across player instances and page
// navigations. On iOS, this is what keeps the audio session active and
// Bluetooth (A2DP) routing intact. If we tore it down between sections,
// the next section's audio would be created outside any active session
// and iOS would route it to the phone speaker instead of Bluetooth.
let keepaliveAudio: HTMLAudioElement | null = null;

function ensureKeepalive() {
  if (keepaliveAudio) return;
  if (typeof window === 'undefined') return;

  const sampleRate = 8000;
  const numSamples = sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, 1, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);

  keepaliveAudio = new Audio(url);
  keepaliveAudio.loop = true;
  keepaliveAudio.volume = 0.01;
  keepaliveAudio.play().catch(() => {});
}

/**
 * Fully tear down the module-level keepalive. Only call on explicit user
 * "close player" — never on component unmount / natural section end, or
 * Bluetooth routing will break on the next page.
 */
export function shutdownKeepalive() {
  if (keepaliveAudio) {
    keepaliveAudio.pause();
    keepaliveAudio.src = '';
    keepaliveAudio = null;
  }
}

export interface TTSPlayer {
  /** Initialize audio — MUST be called from a user gesture (click/tap). */
  init(): void;
  /** Fetch (or use cache), and play a chunk. Resolves when playback starts. */
  playChunk(text: string): Promise<void>;
  /** Fetch and cache a chunk without playing. */
  prefetch(text: string): Promise<void>;
  /** Stop all current playback and cancel pending callbacks. */
  stopCurrent(): void;
  /** Pause playback. */
  pause(): void;
  /** Resume from pause. */
  resume(): void;
  /** Whether audio is currently paused. */
  isPaused(): boolean;
  /** Register callback fired when current chunk finishes playing. */
  setOnEnded(cb: (() => void) | null): void;
  /** Adjust playback speed (0.5-2.0). Time-stretched, not pitch-shifted. */
  setPlaybackRate(rate: number): void;
  /** Get current playback rate. */
  getPlaybackRate(): number;
  /** Set the voice for subsequent API calls. Stops playback and clears cache. */
  setVoice(voice: string): void;
  /** Get current voice. */
  getVoice(): string;
  /** Pause current chunk but keep keepalive running. */
  pausePlayback(): void;
  /** Whether the keepalive audio element is active. */
  isKeepaliveActive(): boolean;
  /** Tear down and clear cache. */
  cleanup(): void;
}

export function createTTSPlayer(): TTSPlayer {
  let currentAudio: HTMLAudioElement | null = null;
  let onEndedCallback: (() => void) | null = null;
  let playbackRate = 1.0;
  let currentVoice = 'nova';

  // Generation counter: incremented on every stop/voice-change/cleanup.
  // Each playChunk call captures the current generation; if it changes
  // before playback finishes, the onended callback is suppressed.
  let generation = 0;

  // Cache: text → blob URL of MP3
  const cache = new Map<string, string>();
  // In-flight fetches to avoid duplicate requests
  const inflight = new Map<string, Promise<string>>();

  async function fetchAndCache(text: string): Promise<string> {
    // Check cache first
    const cached = cache.get(text);
    if (cached) return cached;

    // Check if already fetching
    const existing = inflight.get(text);
    if (existing) return existing;

    const promise = (async () => {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text, voice: currentVoice }),
      });

      if (!response.ok) {
        // Check for quota exceeded
        if (response.status === 429) {
          const errorData = await response.json().catch(() => null);
          if (errorData?.error === 'quota_exceeded') {
            const quotaError = new Error('quota_exceeded');
            (quotaError as unknown as Record<string, string>).resetIn = errorData.resetIn || '';
            (quotaError as unknown as Record<string, string>).message = errorData.message || '';
            throw quotaError;
          }
        }
        throw new Error(`TTS fetch failed: ${response.status}`);
      }

      // Verify we got audio
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error(`TTS returned non-audio: ${contentType}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Store in cache, evict oldest if full
      if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          const oldUrl = cache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          cache.delete(firstKey);
        }
      }
      cache.set(text, blobUrl);
      inflight.delete(text);

      return blobUrl;
    })();

    inflight.set(text, promise);
    promise.catch(() => inflight.delete(text));

    return promise;
  }

  function stopCurrent() {
    generation++;

    if (currentAudio) {
      currentAudio.onended = null;
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    }
  }

  async function playChunk(text: string): Promise<void> {
    stopCurrent();

    const myGeneration = generation;
    const blobUrl = await fetchAndCache(text);

    // If generation changed while we were fetching, abort
    if (generation !== myGeneration) return;

    const audio = new Audio(blobUrl);
    audio.playbackRate = playbackRate;

    audio.onended = () => {
      if (currentAudio === audio && generation === myGeneration) {
        currentAudio = null;
        onEndedCallback?.();
      }
    };

    currentAudio = audio;
    await audio.play();
  }

  async function prefetch(text: string): Promise<void> {
    try {
      await fetchAndCache(text);
    } catch {
      // Prefetch failures are non-critical
    }
  }

  function pausePlayback() {
    if (currentAudio) {
      currentAudio.pause();
    }
    // keepalive keeps running
  }

  function isKeepaliveActive(): boolean {
    return keepaliveAudio !== null;
  }

  function pause() {
    if (currentAudio) {
      currentAudio.pause();
    }
  }

  function resume() {
    if (currentAudio) {
      currentAudio.play().catch(() => {});
    }
  }

  function isPaused(): boolean {
    return currentAudio?.paused || false;
  }

  function setOnEnded(cb: (() => void) | null) {
    onEndedCallback = cb;
  }

  function setPlaybackRate(rate: number) {
    playbackRate = rate;
    if (currentAudio) {
      currentAudio.playbackRate = rate;
    }
  }

  function getPlaybackRate(): number {
    return playbackRate;
  }

  function setVoice(voice: string) {
    if (voice !== currentVoice) {
      stopCurrent();
      currentVoice = voice;
      // Clear cache — different voice produces different audio
      for (const url of cache.values()) {
        URL.revokeObjectURL(url);
      }
      cache.clear();
      inflight.clear();
    }
  }

  function getVoice(): string {
    return currentVoice;
  }

  /** Initialize — call from user gesture to unlock audio on iOS. */
  function init() {
    ensureKeepalive();
  }

  function cleanup() {
    stopCurrent();
    // NOTE: deliberately do NOT stop the module-level keepalive here.
    // Keeping it alive across player instances preserves the iOS audio
    // session so subsequent sections still route through Bluetooth.
    onEndedCallback = null;
    for (const url of cache.values()) {
      URL.revokeObjectURL(url);
    }
    cache.clear();
    inflight.clear();
  }

  return {
    init,
    playChunk,
    prefetch,
    stopCurrent,
    pausePlayback,
    isKeepaliveActive,
    pause,
    resume,
    isPaused,
    setOnEnded,
    setPlaybackRate,
    getPlaybackRate,
    setVoice,
    getVoice,
    cleanup,
  };
}
