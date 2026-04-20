'use client';

import { useState, useRef, useEffect } from 'react';
import { courseConfig } from '@/lib/course.config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isDraft?: boolean;
}

interface BPDraftChatProps {
  sectionType: 'exec-summary' | 'introduction';
  sectionTitle: string;
  planContent: string;
  isOpen: boolean;
  onClose: () => void;
  onInsertDraft: (text: string) => void;
}

export default function BPDraftChat({
  sectionType,
  sectionTitle,
  planContent,
  isOpen,
  onClose,
  onInsertDraft,
}: BPDraftChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftInserted, setDraftInserted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevSectionRef = useRef(sectionType);

  useEffect(() => {
    if (prevSectionRef.current !== sectionType) {
      setMessages([]);
      prevSectionRef.current = sectionType;
    }
  }, [sectionType]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: ChatMessage = sectionType === 'exec-summary'
        ? {
            role: 'assistant',
            content: `I'll help you write your Executive Summary by synthesizing all the work you've done across your ${courseConfig.capstone.navLabel.toLowerCase()}. I can see your completed sections and will draft a compelling summary that highlights your key points.\n\nWould you like me to draft the executive summary now, or is there anything specific you'd like to emphasize?`,
          }
        : {
            role: 'assistant',
            content: `Let's write your Introduction together! This is your chance to reflect on the journey of creating this ${courseConfig.capstone.navLabel.toLowerCase()}.\n\nTo get started, I'd love to hear: What inspired you to choose this particular topic? And what was the most surprising thing you learned while developing your ${courseConfig.capstone.navLabel.toLowerCase()}?`,
          };
      setMessages([welcome]);
    }
  }, [isOpen, messages.length, sectionType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = updatedMessages
        .filter((_, i) => i > 0 || updatedMessages[0].role === 'user')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/business-plan/draft-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType,
          messages: apiMessages,
          planContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Sorry, something went wrong: ${data.error || 'Please try again.'}` },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.message, isDraft: data.hasDraft },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please check your connection and try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const extractDraftContent = (message: string): string => {
    const draftMatch = message.match(/---\s*DRAFT\s*---\n([\s\S]*?)\n---\s*END DRAFT\s*---/);
    if (draftMatch) return draftMatch[1].trim();
    const afterColon = message.match(/(?:here'?s?|draft|response)[^:]*:\s*\n\n([\s\S]+)/i);
    if (afterColon) return afterColon[1].trim();
    return message;
  };

  const handleInsertDraft = (messageContent: string) => {
    const draft = extractDraftContent(messageContent);
    onInsertDraft(draft);
    setDraftInserted(true);
    setTimeout(() => setDraftInserted(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />
      )}

      <div
        role="dialog"
        aria-label="AI drafting assistant"
        className={`fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 transform transition-transform z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Drafting Assistant</h3>
              <p className="text-xs text-purple-200">{sectionTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800 px-4 py-2 flex-shrink-0">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            <span className="font-semibold">
              {sectionType === 'exec-summary'
                ? 'I\'ll synthesize your full business plan into a compelling summary.'
                : 'Answer my questions and I\'ll help you write a reflective introduction.'}
            </span>
            {' '}Click &quot;Use This Draft&quot; to insert it.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[90%]">
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : msg.isDraft
                      ? 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}
                >
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
                {msg.isDraft && msg.role === 'assistant' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleInsertDraft(msg.content)}
                      className="px-3 py-1.5 min-h-[44px] text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Use This Draft
                    </button>
                    <span className="text-xs text-gray-400 self-center">Inserts into your text area</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {draftInserted && (
            <div className="flex justify-center">
              <div className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Draft inserted!
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && !loading && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {(sectionType === 'exec-summary'
                ? ['Draft my executive summary now', 'What should I emphasize?']
                : ['I chose this business because...', 'The most surprising thing I learned was...']
              ).map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(suggestion); }}
                  className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sectionType === 'exec-summary' ? 'Ask questions or request a draft...' : 'Share your reflections...'}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 text-base sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`flex-shrink-0 p-2.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors ${
                input.trim() && !loading
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 px-1">Press Enter to send</p>
        </div>
      </div>
    </>
  );
}
