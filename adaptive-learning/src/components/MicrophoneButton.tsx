'use client';

import { useCallback, useState, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface MicrophoneButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  /** Class for the outer wrapper — use for positioning (e.g. "absolute bottom-3 right-3") */
  className?: string;
  /** When true, render status text below the textarea (caller must place a sibling element) */
  showStatus?: boolean;
}

const TOOLTIP_KEY = 'mic-tooltip-dismissed';

export default function MicrophoneButton({ onTranscript, disabled, className = '', showStatus = false }: MicrophoneButtonProps) {
  const handleTranscript = useCallback((text: string) => {
    onTranscript(text);
  }, [onTranscript]);

  const { isListening, isSupported, interimTranscript, error, startListening, stopListening } = useSpeechToText(handleTranscript);

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    try {
      if (!localStorage.getItem(TOOLTIP_KEY)) {
        setShowTooltip(true);
        const timer = setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem(TOOLTIP_KEY, '1');
        }, 6000);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable
    }
  }, [isSupported]);

  if (!isSupported) return null;

  function handleClick() {
    if (showTooltip) {
      setShowTooltip(false);
      try { localStorage.setItem(TOOLTIP_KEY, '1'); } catch { /* */ }
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  return (
    <>
      {/* The button itself — positioned by className (typically absolute) */}
      <div className={className}>
        <div className="relative">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all ${
              disabled
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : isListening
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 ring-2 ring-red-300 dark:ring-red-700 animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* First-visit tooltip */}
          {showTooltip && !disabled && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-2 shadow-lg z-50 pointer-events-none animate-fade-in">
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
              Tip: You can speak your response using the microphone!
            </div>
          )}
        </div>
      </div>

      {/* Status indicators — rendered in normal flow (outside absolute positioning) */}
      {showStatus && (isListening || error) && (
        <div className="flex items-center gap-2 text-xs mt-1">
          {isListening && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              Listening...
            </span>
          )}
          {isListening && interimTranscript && (
            <span className="text-gray-400 dark:text-gray-500 italic truncate">
              {interimTranscript}
            </span>
          )}
          {error && (
            <span className="text-red-500 dark:text-red-400">
              {error}
            </span>
          )}
        </div>
      )}
    </>
  );
}
