'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ContentRenderer from '@/components/ContentRenderer';
import QuizGate from '@/components/QuizGate';
import FreeTextPrompt from '@/components/FreeTextPrompt';
import RemediationPanel from '@/components/RemediationPanel';
import AskQuestionPanel from '@/components/AskQuestionPanel';
import TTSController from '@/components/TTSController';
import type { SectionContent, GateQuiz, ProgressStatus } from '@/lib/types';

type FlowStep = 'content' | 'quiz' | 'remediation' | 'free_text' | 'completed';

interface Props {
  section: SectionContent;
  quiz: GateQuiz;
  chapterId: number;
  sectionId: string;
  initialStatus: ProgressStatus;
  hasPassedQuiz: boolean;
  hasPassedFreeText: boolean;
  savedQuizScore: number | null;
  nextSectionUrl: string | null;
  chapterUrl: string;
}

export default function SectionLearningFlow({
  section,
  quiz,
  chapterId,
  sectionId,
  initialStatus,
  hasPassedQuiz,
  hasPassedFreeText,
  savedQuizScore,
  nextSectionUrl,
  chapterUrl,
}: Props) {
  const router = useRouter();

  // Determine initial step based on actual progress in the database
  function getInitialStep(): FlowStep {
    if (initialStatus === 'completed') return 'completed';
    if (hasPassedQuiz) return 'free_text'; // Quiz done, resume at writing
    return 'content';
  }

  const [currentStep, setCurrentStep] = useState<FlowStep>(getInitialStep());
  const [quizScore, setQuizScore] = useState<number | null>(savedQuizScore);
  const [freeTextScore, setFreeTextScore] = useState<number | null>(null);
  const [missedQuestionIds, setMissedQuestionIds] = useState<string[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, number>>({});
  const [remediationCount, setRemediationCount] = useState(0);
  const [showReviewContent, setShowReviewContent] = useState(false);
  const [reviewingContent, setReviewingContent] = useState(false);
  const [askQuestionContext, setAskQuestionContext] = useState<{
    blockTitle: string;
    blockBody: string;
  } | null>(null);
  const [showTTS, setShowTTS] = useState(false);
  const [ttsBlockIndex, setTTSBlockIndex] = useState<number | undefined>(undefined);
  const [ttsChunkIndex, setTTSChunkIndex] = useState<number | undefined>(undefined);

  // Auto-advance countdown state (Improvement 4)
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  // TTS glow hint counter (Improvement 1)
  const [ttsHintCount, setTtsHintCount] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('tts-hint-count') || '0', 10);
    }
    return 0;
  });

  // Compute TTS block indices for quiz and free-text auto-step (Improvement 3)
  const quizStartIndex = useMemo(() => {
    let idx = 1; // title
    if (section.learningObjectives.length > 0) idx += 1;
    idx += section.contentBlocks.length;
    if (section.keyTerms.length > 0) idx += 1;
    return idx;
  }, [section]);

  const freeTextStartIndex = useMemo(() => {
    return quizStartIndex + 1 + (quiz?.questions.length || 0) + 1;
  }, [quizStartIndex, quiz]);

  // Auto-step to quiz when TTS reaches quiz blocks (Improvement 3)
  useEffect(() => {
    if (ttsBlockIndex !== undefined && ttsBlockIndex >= quizStartIndex && currentStep === 'content') {
      handleReadyForQuiz();
    }
  }, [ttsBlockIndex, quizStartIndex, currentStep]);

  // Auto-step to free_text when TTS reaches free-text blocks (Improvement 3)
  useEffect(() => {
    if (ttsBlockIndex !== undefined && ttsBlockIndex >= freeTextStartIndex && currentStep === 'quiz') {
      // Only auto-advance to free_text if quiz is already passed
      if (quizScore !== null && quizScore >= quiz.passThreshold) {
        setCurrentStep('free_text');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [ttsBlockIndex, freeTextStartIndex, currentStep, quizScore, quiz.passThreshold]);

  // Auto-advance countdown (Improvement 4)
  useEffect(() => {
    if (currentStep !== 'completed' || !nextSectionUrl) return;
    setAutoAdvanceCountdown(5);
    const timer = setInterval(() => {
      setAutoAdvanceCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          router.push(nextSectionUrl);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, nextSectionUrl, router]);

  const handleTTSBlockChange = useCallback((index: number) => {
    setTTSBlockIndex(index);
  }, []);

  const handleTTSChunkChange = useCallback((index: number) => {
    setTTSChunkIndex(index);
  }, []);

  function handleReadyForQuiz() {
    setCurrentStep('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleQuizResult(passed: boolean, score: number, missedIds?: string[], answers?: Record<string, number>) {
    setQuizScore(score);
    if (passed) {
      setCurrentStep('free_text');
    } else {
      setMissedQuestionIds(missedIds || []);
      if (answers) setStudentAnswers(answers);
      setRemediationCount((prev) => prev + 1);
      setCurrentStep('remediation');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleFreeTextResult(passed: boolean, score: number) {
    setFreeTextScore(score);
    if (passed) {
      setCurrentStep('completed');
      router.refresh();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps Indicator */}
      <nav aria-label="Learning progress" className="flex flex-wrap items-center gap-2 justify-center">
        {(['content', 'quiz', 'free_text', 'completed'] as FlowStep[]).map((step, i) => {
          const labels = ['Read', 'Quiz', 'Write', 'Done'];
          const isActive = step === currentStep || (step === 'quiz' && currentStep === 'remediation');
          const isPast =
            (step === 'content' && ['quiz', 'remediation', 'free_text', 'completed'].includes(currentStep)) ||
            (step === 'quiz' && ['free_text', 'completed'].includes(currentStep)) ||
            (step === 'free_text' && currentStep === 'completed');

          const canClick = isPast && step === 'content' && !reviewingContent;

          return (
            <div key={step} className="flex items-center gap-2">
              {canClick ? (
                <button
                  onClick={() => { setReviewingContent(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  aria-label="Review reading material"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer"
                >
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {labels[i]}
                </button>
              ) : (
                <div
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isPast
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {isPast ? (
                    <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-4 text-center">{i + 1}</span>
                  )}
                  {labels[i]}
                </div>
              )}
              {i < 3 && (
                <div className={`w-4 sm:w-8 h-0.5 ${isPast ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Review Content (when clicking Read pill after completing it) */}
      {reviewingContent && currentStep !== 'content' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">📖 Reviewing Reading Material</h3>
            <button
              onClick={() => { setReviewingContent(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
            >
              ✕ Close Review
            </button>
          </div>
          <ContentRenderer section={section} />
        </div>
      )}

      {/* Remediation Step */}
      {currentStep === 'remediation' && (
        <RemediationPanel
          chapterId={chapterId}
          sectionId={sectionId}
          missedQuestionIds={missedQuestionIds}
          studentAnswers={studentAnswers}
          quizScore={quizScore || 0}
          passThreshold={quiz.passThreshold}
          remediationCount={remediationCount}
          onReadyToRetry={() => {
            setCurrentStep('quiz');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSkip={remediationCount >= 3 ? () => {
            setCurrentStep('free_text');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } : undefined}
        />
      )}

      {/* Content Step */}
      {currentStep === 'content' && (
        <>
          {/* Listen button */}
          <div className="flex flex-col items-end">
            <button
              onClick={() => {
                setShowTTS(!showTTS);
                if (!showTTS && ttsHintCount < 3) {
                  const newCount = ttsHintCount + 1;
                  setTtsHintCount(newCount);
                  localStorage.setItem('tts-hint-count', String(newCount));
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showTTS
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600${ttsHintCount < 3 ? ' animate-pulse ring-2 ring-blue-400/50' : ''}`
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              {showTTS ? 'Close Player' : 'Listen'}
            </button>
            {!showTTS && ttsHintCount < 3 && (
              <p className="text-xs text-blue-400 mt-1 text-right">Tap to listen to this section</p>
            )}
          </div>

          <ContentRenderer
            section={section}
            onAskQuestion={(title, body) => setAskQuestionContext({ blockTitle: title, blockBody: body })}
            highlightBlockIndex={showTTS ? ttsBlockIndex : undefined}
            highlightChunkIndex={showTTS ? ttsChunkIndex : undefined}
          />
          <div className={`flex justify-center pt-4 ${showTTS ? 'pb-20' : ''}`}>
            <button
              onClick={handleReadyForQuiz}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-lg"
            >
              I&apos;m ready for the Knowledge Check
            </button>
          </div>
        </>
      )}

      {/* Quiz Step */}
      {currentStep === 'quiz' && (
        <QuizGate
          quiz={quiz}
          chapterId={chapterId}
          sectionId={sectionId}
          onResult={handleQuizResult}
        />
      )}

      {/* Free Text Step */}
      {currentStep === 'free_text' && (
        <FreeTextPrompt
          prompt={section.freeTextPrompt}
          chapterId={chapterId}
          sectionId={sectionId}
          onResult={handleFreeTextResult}
        />
      )}

      {/* Completed Step */}
      {currentStep === 'completed' && (
        <div className="space-y-6">
          {/* Auto-advance banner (Improvement 4) */}
          {autoAdvanceCountdown !== null && nextSectionUrl && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Continuing to next section in {autoAdvanceCountdown}...
              </p>
              <button onClick={() => setAutoAdvanceCountdown(null)}
                className="text-sm text-blue-600 font-medium hover:text-blue-800">
                Stay Here
              </button>
            </div>
          )}
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
              Section Complete!
            </h3>
            <p className="text-green-700 dark:text-green-400 mb-2">
              You&apos;ve mastered {section.sectionId} &mdash; {section.title}
            </p>
            {quizScore !== null && freeTextScore !== null && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-6">
                Quiz: {Math.round(quizScore)}% | Written: {freeTextScore}% |
                Mastery: {Math.round(quizScore * 0.6 + freeTextScore * 0.4)}%
              </p>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => router.push(chapterUrl)}
                className="px-6 py-3 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                Back to Chapter
              </button>
              <button
                onClick={() => {
                  setShowReviewContent(!showReviewContent);
                  if (!showReviewContent) {
                    setTimeout(() => window.scrollTo({ top: 400, behavior: 'smooth' }), 100);
                  }
                }}
                className="px-6 py-3 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
              >
                {showReviewContent ? 'Hide Content' : '📖 Review Content'}
              </button>
              {nextSectionUrl && (
                <button
                  onClick={() => router.push(nextSectionUrl)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Next Section &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Review Content (expandable) */}
          {showReviewContent && (
            <ContentRenderer
              section={section}
              onAskQuestion={(title, body) => setAskQuestionContext({ blockTitle: title, blockBody: body })}
            />
          )}
        </div>
      )}

      {/* TTS Controller - fixed bottom bar, persists across all steps */}
      {showTTS && (
        <TTSController
          section={section}
          quiz={quiz}
          onBlockIndexChange={handleTTSBlockChange}
          onChunkIndexChange={handleTTSChunkChange}
          onClose={() => { setShowTTS(false); setTTSBlockIndex(undefined); setTTSChunkIndex(undefined); }}
        />
      )}

      {/* Ask a Question Panel - slide-out from right */}
      <AskQuestionPanel
        isOpen={askQuestionContext !== null}
        onClose={() => setAskQuestionContext(null)}
        chapterId={chapterId}
        sectionId={sectionId}
        blockTitle={askQuestionContext?.blockTitle || ''}
        blockBody={askQuestionContext?.blockBody || ''}
        sectionTitle={section.title}
      />
    </div>
  );
}
