'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createTTSPlayer, shutdownKeepalive, type TTSPlayer } from '@/lib/openaiTTSPlayer';

export interface TTSBlock {
  label: string;
  text: string;
}

export interface TTSMediaMetadata {
  title: string;
  artist: string;
}

// Available OpenAI TTS voices
export const TTS_VOICES = [
  { id: 'nova', label: 'Nova', description: 'Female, warm' },
  { id: 'shimmer', label: 'Shimmer', description: 'Female, bright' },
  { id: 'alloy', label: 'Alloy', description: 'Neutral' },
  { id: 'echo', label: 'Echo', description: 'Male' },
  { id: 'fable', label: 'Fable', description: 'Male, warm' },
  { id: 'onyx', label: 'Onyx', description: 'Male, deep' },
] as const;

export type TTSVoiceId = typeof TTS_VOICES[number]['id'];

interface UseTextToSpeechReturn {
  isPlaying: boolean;
  isPaused: boolean;
  isSupported: boolean;
  currentBlockIndex: number;
  currentChunkIndex: number;
  totalBlocks: number;
  currentBlockLabel: string;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  destroy: () => void;
  skipForward: () => void;
  skipBack: () => void;
  rateLabel: string;
  cycleRate: () => void;
  /** Current voice ID (only meaningful in OpenAI mode) */
  voiceId: TTSVoiceId;
  /** Current voice display label */
  voiceLabel: string;
  /** Cycle to the next voice */
  cycleVoice: () => void;
  /** Whether OpenAI TTS is active (vs SpeechSynthesis fallback) */
  isOpenAIMode: boolean;
  /** If set, the premium voice quota was exceeded — shows reset info */
  quotaMessage: string | null;
}

// Mobile browsers (especially iOS) scale speech rate much more aggressively
// than desktop — a rate of 1.5 on iOS sounds like 5x on desktop.
// Use compressed rates on mobile to keep speeds natural.
// These only apply to SpeechSynthesis fallback — OpenAI mode uses actual rates.
const DESKTOP_RATES = [0.75, 1.0, 1.25, 1.5, 2.0];
const MOBILE_RATES = [0.85, 1.0, 1.05, 1.1, 1.15];
// Rate values for OpenAI TTS (HTMLAudioElement.playbackRate).
// HTMLAudioElement uses time-stretching (preserves pitch) unlike
// AudioBufferSourceNode which pitch-shifts. So we can use natural rates.
const OPENAI_RATES = [0.75, 1.0, 1.25, 1.5, 2.0];
// Display labels shown to the user (same for all platforms)
const RATE_LABELS = ['0.75x', '1x', '1.25x', '1.5x', '2x'];

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function getSpeechSynthesisRates(): number[] {
  return isMobile() ? MOBILE_RATES : DESKTOP_RATES;
}

/**
 * Split text into sentence-sized chunks (~200 chars max) to avoid
 * the iOS Safari bug where long utterances get cut off after ~15 seconds.
 * Exported so ContentRenderer can split text the same way for highlighting.
 */
export function chunkText(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length > 200 && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks.length > 0 ? chunks : [text];
}

// ─── OpenAI TTS availability detection ───────────────────────────────
// Lightweight GET check to /api/tts — returns { available: true/false }
// without requiring auth or making an OpenAI API call.
// Cached in sessionStorage for 5 minutes.

let openaiAvailable: boolean | null = null;

async function checkOpenAIAvailability(): Promise<boolean> {
  if (openaiAvailable !== null) return openaiAvailable;

  // Check sessionStorage cache (with expiry)
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem('tts-openai-check');
    if (cached) {
      try {
        const { available, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          openaiAvailable = !!available;
          return openaiAvailable;
        }
      } catch { /* invalid cache, re-check */ }
    }
  }

  try {
    const response = await fetch('/api/tts', { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      openaiAvailable = data.available === true;
    } else {
      openaiAvailable = false;
    }
  } catch {
    openaiAvailable = false;
  }

  // Cache result with timestamp
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('tts-openai-check', JSON.stringify({
      available: openaiAvailable,
      timestamp: Date.now(),
    }));
  }

  return openaiAvailable;
}

// ─── SpeechSynthesis silent audio keepalive ──────────────────────────
// Only used in SpeechSynthesis fallback mode. Keeps audio session alive
// on lock screen. (In OpenAI mode, real audio maintains the session.)

let silentAudioCtx: AudioContext | null = null;
let silentSource: AudioBufferSourceNode | null = null;

function startSilentAudio() {
  if (typeof window === 'undefined') return;
  if (silentAudioCtx && silentAudioCtx.state !== 'closed') return;

  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;

  silentAudioCtx = new AC();
  const sampleRate = silentAudioCtx.sampleRate;
  const buffer = silentAudioCtx.createBuffer(1, sampleRate, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = 0.00001;
  }

  silentSource = silentAudioCtx.createBufferSource();
  silentSource.buffer = buffer;
  silentSource.loop = true;
  const gain = silentAudioCtx.createGain();
  gain.gain.value = 0.01;
  silentSource.connect(gain);
  gain.connect(silentAudioCtx.destination);
  silentSource.start();

  if (silentAudioCtx.state === 'suspended') {
    silentAudioCtx.resume().catch(() => {});
  }
}

function stopSilentAudio() {
  if (silentSource) {
    try { silentSource.stop(); } catch { /* already stopped */ }
    silentSource = null;
  }
  if (silentAudioCtx) {
    silentAudioCtx.close().catch(() => {});
    silentAudioCtx = null;
  }
}

// ─── Media Session API ────────────────────────────────────────────────

function updateMediaSession(
  metadata: TTSMediaMetadata | null,
  blockLabel: string,
  handlers: {
    play: () => void;
    pause: () => void;
    skipForward: () => void;
    skipBack: () => void;
  } | null,
) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  if (metadata && handlers) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: blockLabel || metadata.title,
      artist: metadata.artist,
      album: metadata.title,
    });

    navigator.mediaSession.setActionHandler('play', handlers.play);
    navigator.mediaSession.setActionHandler('pause', handlers.pause);
    navigator.mediaSession.setActionHandler('previoustrack', handlers.skipBack);
    navigator.mediaSession.setActionHandler('nexttrack', handlers.skipForward);
  } else {
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }
}

// ─── Main hook ────────────────────────────────────────────────────────

export function useTextToSpeech(
  blocks: TTSBlock[],
  mediaMetadata?: TTSMediaMetadata,
): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [rateIndex, setRateIndex] = useState(1); // index 1 = 1.0x
  const [useOpenAI, setUseOpenAI] = useState<boolean | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  // Voice state — persisted in localStorage
  const [voiceIndex, setVoiceIndex] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('tts-voice');
      if (saved) {
        const idx = TTS_VOICES.findIndex(v => v.id === saved);
        if (idx >= 0) return idx;
      }
    }
    return 3; // Default: echo
  });

  const blockIndexRef = useRef(0);
  const chunkIndexRef = useRef(0);
  const chunksRef = useRef<string[][]>([]);
  const isPlayingRef = useRef(false);
  const rateRef = useRef(1.0);
  const ttsPlayerRef = useRef<TTSPlayer | null>(null);
  const speakChunkSpeechSynthesisRef = useRef<() => void>(() => {});

  // Update rate ref based on mode
  rateRef.current = useOpenAI
    ? OPENAI_RATES[rateIndex]
    : getSpeechSynthesisRates()[rateIndex];

  // Detect support and OpenAI availability on mount
  useEffect(() => {
    const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

    checkOpenAIAvailability().then((available) => {
      setUseOpenAI(available);
      setIsSupported(available || hasSpeechSynthesis);
    });
  }, []);

  // Pre-chunk all blocks
  useEffect(() => {
    chunksRef.current = blocks.map(b => chunkText(b.text));
  }, [blocks]);

  // ─── Pre-fetch helper (OpenAI mode) ──────────────────────────────

  const prefetchAhead = useCallback((count: number) => {
    const player = ttsPlayerRef.current;
    if (!player) return;

    let blockIdx = blockIndexRef.current;
    let chunkIdx = chunkIndexRef.current + 1;
    const allChunks = chunksRef.current;
    let fetched = 0;

    while (fetched < count && blockIdx < allChunks.length) {
      const blockChunks = allChunks[blockIdx];
      if (chunkIdx < blockChunks.length) {
        player.prefetch(blockChunks[chunkIdx]);
        fetched++;
        chunkIdx++;
      } else {
        blockIdx++;
        chunkIdx = 0;
      }
    }
  }, []);

  // ─── OpenAI playback ────────────────────────────────────────────

  const speakChunkOpenAI = useCallback(() => {
    if (!isPlayingRef.current) return;

    const player = ttsPlayerRef.current;
    if (!player) return;

    const blockIdx = blockIndexRef.current;
    const chunkIdx = chunkIndexRef.current;
    const allChunks = chunksRef.current;

    if (blockIdx >= allChunks.length) {
      // Done with all blocks. Reset to start but keep the player AND the
      // module-level keepalive alive so the next section (or a replay)
      // still routes through Bluetooth on iOS.
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentBlockIndex(0);
      setCurrentChunkIndex(0);
      blockIndexRef.current = 0;
      chunkIndexRef.current = 0;
      player.stopCurrent();
      updateMediaSession(null, '', null);
      return;
    }

    const blockChunks = allChunks[blockIdx];
    if (chunkIdx >= blockChunks.length) {
      // Move to next block with a brief pause. Don't publish an
      // out-of-bounds block index — let the end-of-all guard handle it
      // on the next tick so the UI / Media Session don't briefly show
      // a stale "next section" label.
      blockIndexRef.current = blockIdx + 1;
      chunkIndexRef.current = 0;
      if (blockIdx + 1 < allChunks.length) {
        setCurrentBlockIndex(blockIdx + 1);
      }
      setTimeout(() => speakChunkOpenAI(), 500);
      return;
    }

    setCurrentChunkIndex(chunkIdx);

    player.setOnEnded(() => {
      chunkIndexRef.current = chunkIdx + 1;
      prefetchAhead(2);
      speakChunkOpenAI();
    });

    player.playChunk(blockChunks[chunkIdx]).catch((err) => {
      console.warn('OpenAI TTS chunk error:', err);

      // Quota exceeded — fall back to SpeechSynthesis for the rest of this session
      if (err?.message === 'quota_exceeded') {
        const resetMsg = (err as Record<string, string>).message
          || 'Premium voice limit reached for today. Switching to standard voice.';
        setQuotaMessage(resetMsg);

        // Clean up OpenAI player
        player.cleanup();
        ttsPlayerRef.current = null;

        // Switch to SpeechSynthesis mode and continue playing from current position
        setUseOpenAI(false);
        rateRef.current = getSpeechSynthesisRates()[rateIndex];
        startSilentAudio();
        speakChunkSpeechSynthesisRef.current();
        return;
      }

      // Other errors — retry once after 1 second
      setTimeout(() => {
        if (isPlayingRef.current) {
          player.playChunk(blockChunks[chunkIdx]).catch(() => {
            // Give up — stop playback
            isPlayingRef.current = false;
            setIsPlaying(false);
            player.cleanup();
            ttsPlayerRef.current = null;
          });
        }
      }, 1000);
    });

    prefetchAhead(2);
  }, [prefetchAhead, rateIndex]);

  // ─── SpeechSynthesis playback (fallback) ─────────────────────────

  const speakChunkSpeechSynthesis = useCallback(() => {
    if (!isPlayingRef.current) return;

    const blockIdx = blockIndexRef.current;
    const chunkIdx = chunkIndexRef.current;
    const allChunks = chunksRef.current;

    if (blockIdx >= allChunks.length) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentBlockIndex(0);
      setCurrentChunkIndex(0);
      blockIndexRef.current = 0;
      chunkIndexRef.current = 0;
      // Keep silent audio alive so the next page still routes to Bluetooth
      updateMediaSession(null, '', null);
      return;
    }

    const blockChunks = allChunks[blockIdx];
    if (chunkIdx >= blockChunks.length) {
      blockIndexRef.current = blockIdx + 1;
      chunkIndexRef.current = 0;
      if (blockIdx + 1 < allChunks.length) {
        setCurrentBlockIndex(blockIdx + 1);
      }
      setTimeout(() => speakChunkSpeechSynthesis(), 500);
      return;
    }

    setCurrentChunkIndex(chunkIdx);

    const utterance = new SpeechSynthesisUtterance(blockChunks[chunkIdx]);
    utterance.lang = 'en-US';
    utterance.rate = rateRef.current;

    utterance.onend = () => {
      chunkIndexRef.current = chunkIdx + 1;
      speakChunkSpeechSynthesis();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('TTS error:', e.error);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Keep ref in sync so OpenAI fallback can call it
  speakChunkSpeechSynthesisRef.current = speakChunkSpeechSynthesis;

  // ─── Unified controls ────────────────────────────────────────────

  const play = useCallback(() => {
    if (!isSupported) return;

    if (useOpenAI) {
      // OpenAI mode
      if (!ttsPlayerRef.current) {
        ttsPlayerRef.current = createTTSPlayer();
      }
      // CRITICAL: init AudioContext NOW, within the user gesture (click/tap).
      // iOS Safari requires AudioContext to be created+resumed in the direct
      // call stack of a user interaction. If deferred to an async callback
      // (like inside playChunk's fetch), iOS silently blocks audio output.
      ttsPlayerRef.current.init();
      ttsPlayerRef.current.setVoice(TTS_VOICES[voiceIndex].id);
      ttsPlayerRef.current.setPlaybackRate(OPENAI_RATES[rateIndex]);

      // Pre-fetch first few chunks to reduce initial delay
      const firstChunks = chunksRef.current[0];
      if (firstChunks) {
        for (let i = 0; i < Math.min(3, firstChunks.length); i++) {
          ttsPlayerRef.current.prefetch(firstChunks[i]);
        }
      }

      blockIndexRef.current = 0;
      chunkIndexRef.current = 0;
      setCurrentBlockIndex(0);
      setCurrentChunkIndex(0);
      isPlayingRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);
      speakChunkOpenAI();
    } else {
      // SpeechSynthesis fallback
      window.speechSynthesis.cancel();
      blockIndexRef.current = 0;
      chunkIndexRef.current = 0;
      setCurrentBlockIndex(0);
      setCurrentChunkIndex(0);
      isPlayingRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);
      startSilentAudio();
      speakChunkSpeechSynthesis();
    }
  }, [isSupported, useOpenAI, rateIndex, speakChunkOpenAI, speakChunkSpeechSynthesis]);

  const pause = useCallback(() => {
    if (useOpenAI && ttsPlayerRef.current) {
      ttsPlayerRef.current.pause();
    } else {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }, [useOpenAI]);

  const resume = useCallback(() => {
    if (useOpenAI && ttsPlayerRef.current) {
      ttsPlayerRef.current.resume();
    } else {
      window.speechSynthesis.resume();
    }
    setIsPaused(false);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  }, [useOpenAI]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;

    if (useOpenAI && ttsPlayerRef.current) {
      ttsPlayerRef.current.stopCurrent();
      // Keep player and keepalive alive for Bluetooth persistence
    } else {
      window.speechSynthesis.cancel();
      // Don't stop silent audio — keep audio session alive
    }

    setIsPlaying(false);
    setIsPaused(false);
    setCurrentBlockIndex(0);
    setCurrentChunkIndex(0);
    blockIndexRef.current = 0;
    chunkIndexRef.current = 0;
    updateMediaSession(null, '', null);
  }, [useOpenAI]);

  const destroy = useCallback(() => {
    isPlayingRef.current = false;

    if (useOpenAI && ttsPlayerRef.current) {
      ttsPlayerRef.current.cleanup();
      ttsPlayerRef.current = null;
      // User explicitly closed the player — fully release the iOS
      // audio session. (Not called on page navigation unmount.)
      shutdownKeepalive();
    } else {
      window.speechSynthesis.cancel();
      stopSilentAudio();
    }

    setIsPlaying(false);
    setIsPaused(false);
    setCurrentBlockIndex(0);
    setCurrentChunkIndex(0);
    blockIndexRef.current = 0;
    chunkIndexRef.current = 0;
    updateMediaSession(null, '', null);
  }, [useOpenAI]);

  const skipForward = useCallback(() => {
    if (blockIndexRef.current >= blocks.length - 1) return;

    if (useOpenAI && ttsPlayerRef.current) {
      ttsPlayerRef.current.stopCurrent();
    } else {
      window.speechSynthesis.cancel();
    }

    blockIndexRef.current += 1;
    chunkIndexRef.current = 0;
    setCurrentBlockIndex(blockIndexRef.current);
    setCurrentChunkIndex(0);
    setIsPaused(false);

    if (useOpenAI) {
      speakChunkOpenAI();
    } else {
      speakChunkSpeechSynthesis();
    }
  }, [blocks.length, useOpenAI, speakChunkOpenAI, speakChunkSpeechSynthesis]);

  const skipBack = useCallback(() => {
    if (blockIndexRef.current <= 0) return;

    if (useOpenAI && ttsPlayerRef.current) {
      ttsPlayerRef.current.stopCurrent();
    } else {
      window.speechSynthesis.cancel();
    }

    blockIndexRef.current -= 1;
    chunkIndexRef.current = 0;
    setCurrentBlockIndex(blockIndexRef.current);
    setCurrentChunkIndex(0);
    setIsPaused(false);

    if (useOpenAI) {
      speakChunkOpenAI();
    } else {
      speakChunkSpeechSynthesis();
    }
  }, [useOpenAI, speakChunkOpenAI, speakChunkSpeechSynthesis]);

  const cycleVoice = useCallback(() => {
    setVoiceIndex(prev => {
      const nextIdx = (prev + 1) % TTS_VOICES.length;
      const newVoice = TTS_VOICES[nextIdx].id;

      // Persist preference
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tts-voice', newVoice);
      }

      // Update player's voice (stops current + clears cache for new voice)
      if (ttsPlayerRef.current) {
        ttsPlayerRef.current.setVoice(newVoice);

        // If currently playing, restart current chunk with new voice
        // Use a short delay to ensure stopCurrent() fully completes
        if (useOpenAI && isPlayingRef.current) {
          setTimeout(() => {
            if (isPlayingRef.current) {
              speakChunkOpenAI();
            }
          }, 100);
        }
      }

      return nextIdx;
    });
  }, [useOpenAI, speakChunkOpenAI]);

  const cycleRate = useCallback(() => {
    setRateIndex(prev => {
      const nextIdx = (prev + 1) % RATE_LABELS.length;

      if (useOpenAI && ttsPlayerRef.current) {
        // OpenAI: adjust AudioBufferSourceNode.playbackRate (instant)
        const newRate = OPENAI_RATES[nextIdx];
        rateRef.current = newRate;
        ttsPlayerRef.current.setPlaybackRate(newRate);
      } else {
        // SpeechSynthesis: cancel and restart chunk at new rate
        const rates = getSpeechSynthesisRates();
        rateRef.current = rates[nextIdx];
        if (isPlayingRef.current && !window.speechSynthesis.paused) {
          window.speechSynthesis.cancel();
          setTimeout(() => speakChunkSpeechSynthesis(), 50);
        }
      }

      return nextIdx;
    });
  }, [useOpenAI, speakChunkSpeechSynthesis]);

  // ─── Media Session registration ──────────────────────────────────

  useEffect(() => {
    if (!isPlaying || !mediaMetadata) return;

    const currentLabel = blocks[currentBlockIndex]?.label || '';
    updateMediaSession(mediaMetadata, currentLabel, {
      play: () => {
        if (useOpenAI && ttsPlayerRef.current) {
          ttsPlayerRef.current.resume();
        } else {
          window.speechSynthesis.resume();
        }
        setIsPaused(false);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      },
      pause: () => {
        if (useOpenAI && ttsPlayerRef.current) {
          ttsPlayerRef.current.pause();
        } else {
          window.speechSynthesis.pause();
        }
        setIsPaused(true);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      },
      skipForward,
      skipBack,
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';
    }
  }, [isPlaying, isPaused, currentBlockIndex, blocks, mediaMetadata, useOpenAI, skipForward, skipBack]);

  // ─── Cleanup on unmount (full destroy) ───────────────────────────

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (ttsPlayerRef.current) {
        // cleanup() stops current chunk + clears cache but deliberately
        // leaves the module-level keepalive running so the next section's
        // TTS still routes through Bluetooth on iOS.
        ttsPlayerRef.current.cleanup();
        ttsPlayerRef.current = null;
      }
      // Leave SpeechSynthesis keepalive running across navigation too
      updateMediaSession(null, '', null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isPlaying,
    isPaused,
    isSupported,
    currentBlockIndex,
    currentChunkIndex,
    totalBlocks: blocks.length,
    currentBlockLabel: blocks[currentBlockIndex]?.label || '',
    play,
    pause,
    resume,
    stop,
    destroy,
    skipForward,
    skipBack,
    rateLabel: RATE_LABELS[rateIndex],
    cycleRate,
    voiceId: TTS_VOICES[voiceIndex].id,
    voiceLabel: TTS_VOICES[voiceIndex].label,
    cycleVoice,
    isOpenAIMode: useOpenAI === true,
    quotaMessage,
  };
}
