'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { renderMarkdown } from '@/lib/renderMarkdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AskQuestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  sectionId: string;
  blockTitle: string;
  blockBody: string;
  sectionTitle: string;
}

const MAX_MESSAGES = 16; // 8 turns

export default function AskQuestionPanel({
  isOpen,
  onClose,
  chapterId,
  sectionId,
  blockTitle,
  blockBody,
  sectionTitle,
}: AskQuestionPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap — keep Tab within the panel
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen, handleFocusTrap]);

  // Reset conversation when context changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput('');
  }, [blockTitle, blockBody]);

  async function handleSend(overrideQuestion?: string) {
    const question = (overrideQuestion || input).trim();
    if (!question || loading) return;

    if (messages.length >= MAX_MESSAGES) {
      setError('You\'ve reached the conversation limit. For more help, try asking about a different concept or visit your instructor\'s office hours.');
      return;
    }

    // Detect if it's a special deep-dive type
    let deepDiveType: 'ask_question' | 'dive_deeper' | 'real_world_example' = 'ask_question';
    let displayQuestion = question;
    if (question.startsWith('🔍 ')) {
      deepDiveType = 'dive_deeper';
      displayQuestion = 'Explain this concept deeper';
    } else if (question.startsWith('💡 ')) {
      deepDiveType = 'real_world_example';
      displayQuestion = 'Give me a real-world example';
    }

    const newUserMessage: ChatMessage = { role: 'user', content: displayQuestion };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          sectionId,
          type: deepDiveType,
          blockTitle,
          blockBody,
          ...(deepDiveType === 'ask_question'
            ? { messages: updatedMessages }
            : {}),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      setLoading(false);
    } catch {
      setError('Failed to get a response. Please try again.');
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const turnsUsed = Math.ceil(messages.length / 2);
  const turnsRemaining = 8 - turnsUsed;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
          aria-label="Close panel"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ask a question about this concept"
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[50vw] sm:max-w-2xl bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-green-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">
              💬 Ask About: {blockTitle}
            </h3>
            <p className="text-green-100 text-xs truncate">
              {sectionId} — {sectionTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-white hover:text-green-200 ml-2 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Welcome message */}
        {messages.length === 0 && !loading && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">
              Ask me anything about <strong>{blockTitle}</strong>! I&apos;m here to help you understand this concept better.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['🔍 Explain this deeper', '💡 Give me a real-world example', 'Why is this important?', 'Can you give me an analogy?'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="text-xs bg-white dark:bg-gray-700 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-2 py-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <div className="text-sm">{renderMarkdown(msg.content)}</div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Turns remaining indicator */}
        {messages.length > 0 && (
          <div className="px-4 py-1 text-xs text-gray-400 text-center border-t border-gray-100 dark:border-gray-700">
            {turnsRemaining > 0
              ? `${turnsRemaining} question${turnsRemaining !== 1 ? 's' : ''} remaining in this conversation`
              : 'No more questions available — try a different concept'}
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 pb-12 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              disabled={loading || messages.length >= MAX_MESSAGES}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              rows={2}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || messages.length >= MAX_MESSAGES}
              aria-label="Send question"
              className="min-w-[44px] min-h-[44px] px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end flex items-center justify-center"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
