'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useTextToSpeech, type TTSBlock } from './useTextToSpeech';

/**
 * Drives a single shared text-to-speech instance for a list of chat messages.
 * Only one message can play at a time, so listening to a new message stops
 * any message already playing. Built on the same TTS engine as the section
 * Listen button, but without the fixed-bottom player bar.
 */
export function useMessageSpeech() {
  // `active` carries a nonce so re-listening to the same message after it
  // finished still triggers the play effect (its identity always changes).
  const [active, setActive] = useState<{ index: number; nonce: number } | null>(null);
  const [text, setText] = useState('');
  const nonceRef = useRef(0);
  const pendingPlayRef = useRef(false);

  const blocks: TTSBlock[] = useMemo(
    () => (text ? [{ label: 'AI assistant message', text }] : []),
    [text],
  );

  const { isPlaying, play, stop } = useTextToSpeech(blocks);

  // Start playback once the new request's blocks are in place.
  useEffect(() => {
    if (active && pendingPlayRef.current && blocks.length > 0) {
      pendingPlayRef.current = false;
      play();
    }
  }, [active, blocks, play]);

  const toggle = useCallback(
    (index: number, messageText: string) => {
      // Tapping the message that is currently playing just stops it.
      if (active?.index === index && isPlaying) {
        stop();
        setActive(null);
        return;
      }
      stop();
      nonceRef.current += 1;
      pendingPlayRef.current = true;
      setText(messageText);
      setActive({ index, nonce: nonceRef.current });
    },
    [active, isPlaying, stop],
  );

  const stopSpeech = useCallback(() => {
    stop();
    setActive(null);
  }, [stop]);

  return {
    /** Index of the message TTS is currently attached to, or null. */
    speakingIndex: active?.index ?? null,
    /** Whether audio is actively playing right now. */
    isPlaying,
    /** Start/stop listening to message `index`. */
    toggle,
    /** Stop any playback (e.g. when the chat panel closes). */
    stopSpeech,
  };
}
