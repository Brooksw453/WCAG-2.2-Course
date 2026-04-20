'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AssignmentConfig, AssignmentDraft } from '@/lib/types';
import DraftChat from './DraftChat';
import MicrophoneButton from '@/components/MicrophoneButton';
import { courseConfig } from '@/lib/course.config';
import { getScoreColor } from '@/lib/scoreUtils';

interface Props {
  assignment: AssignmentConfig;
  savedDrafts: Record<string, AssignmentDraft>;
  scoreHistory?: Record<string, { draft: number; score: number }[]>;
}

export default function AssignmentWorkspace({ assignment, savedDrafts, scoreHistory = {} }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    assignment.sections.forEach(s => {
      initial[s.key] = savedDrafts[s.key]?.content || '';
    });
    return initial;
  });
  const [feedback, setFeedback] = useState<Record<string, AssignmentDraft['ai_feedback']>>(() => {
    const initial: Record<string, AssignmentDraft['ai_feedback']> = {};
    assignment.sections.forEach(s => {
      if (savedDrafts[s.key]?.ai_feedback) {
        initial[s.key] = savedDrafts[s.key].ai_feedback;
      }
    });
    return initial;
  });
  const [draftNumbers, setDraftNumbers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    assignment.sections.forEach(s => {
      initial[s.key] = savedDrafts[s.key]?.draft_number || 0;
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  const section = assignment.sections[activeSection];
  const currentContent = drafts[section.key] || '';
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const currentFeedback = feedback[section.key];
  const currentDraftNum = draftNumbers[section.key] || 0;

  const handleSubmitSection = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/assignment/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.assignmentId,
          sectionKey: section.key,
          content: currentContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit');
        return;
      }

      setFeedback(prev => ({ ...prev, [section.key]: data.evaluation }));
      setDraftNumbers(prev => ({ ...prev, [section.key]: data.draftNumber }));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, assignment.assignmentId, section.key, currentContent]);

  // Calculate overall progress
  const sectionsWithFeedback = assignment.sections.filter(s => feedback[s.key]).length;
  const totalSections = assignment.sections.length;
  const avgScore = sectionsWithFeedback > 0
    ? Math.round(
        assignment.sections
          .filter(s => feedback[s.key])
          .reduce((sum, s) => sum + (feedback[s.key]?.score || 0), 0) / sectionsWithFeedback
      )
    : 0;

  return (
    <div id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <button
                onClick={() => router.push('/chapters')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Assignment {assignment.assignmentId}: {assignment.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.points} points &bull; {assignment.description}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">{sectionsWithFeedback}/{totalSections} sections submitted</div>
              {avgScore > 0 && (
                <div className={`text-lg font-bold ${getScoreColor(avgScore)}`}>
                  Avg: {avgScore}%
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {assignment.context && (
          <div className="mb-6">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2 flex items-center gap-1"
            >
              {showGuide ? '▾ Hide Assignment Guide' : '▸ Show Assignment Guide'}
            </button>
            {showGuide && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-indigo-900 mb-3">About This Assignment</h3>
                <p className="text-sm text-indigo-800 leading-relaxed mb-4">{assignment.context.purpose}</p>

                <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Learning Goals</h4>
                <ul className="space-y-1.5 mb-4">
                  {assignment.context.goals.map((goal, i) => (
                    <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">✦</span>
                      {goal}
                    </li>
                  ))}
                </ul>

                <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    <span className="font-semibold">How it works:</span> {assignment.context.whatToExpect}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section Navigation - horizontal scroll on mobile, sidebar on desktop */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sections</h2>
              </div>
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible flex-nowrap lg:flex-wrap">
              {assignment.sections.map((s, i) => {
                const hasFeedback = !!feedback[s.key];
                const score = feedback[s.key]?.score;
                const hasContent = (drafts[s.key] || '').trim().length > 0;

                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(i)}
                    className={`min-w-[140px] lg:min-w-0 w-auto lg:w-full text-left px-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-2 transition-colors ${
                      i === activeSection
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      hasFeedback && score !== undefined && score >= courseConfig.thresholds.gradeB ? 'bg-green-500 text-white' :
                      hasFeedback && score !== undefined && score >= courseConfig.thresholds.gradeC ? 'bg-yellow-400 text-white' :
                      hasFeedback ? 'bg-orange-400 text-white' :
                      hasContent ? 'bg-blue-200 text-blue-700' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                    }`}>
                      {hasFeedback && score !== undefined && score >= courseConfig.thresholds.gradeB ? '✓' : (i + 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.title}</div>
                      {hasFeedback && score !== undefined && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Score: {score}%</div>
                      )}
                    </div>
                  </button>
                );
              })}
              </div>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Section Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {activeSection + 1}. {section.title}
                  </h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{section.instructions}</p>
                </div>
                <div className="flex-shrink-0 ml-4 flex gap-2">
                  <button
                    onClick={() => setShowRubric(showRubric === section.key ? null : section.key)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    {showRubric === section.key ? 'Hide Rubric' : 'What We Look For'}
                  </button>
                  <button
                    onClick={() => setShowTips(showTips === section.key ? null : section.key)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {showTips === section.key ? 'Hide Tips' : 'Tips'}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Draft with AI
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-500 self-center">Use AI to help you build your response through guided questions</span>
              </div>

              {showRubric === section.key && section.rubric && (
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase mb-2">Evaluation Criteria</h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">{section.rubric}</p>
                  <p className="text-xs text-indigo-500 dark:text-indigo-500 mt-2">Scoring: 90-100 Excellent | 80-89 Good | 70-79 Satisfactory | Below 70 Needs Improvement</p>
                </div>
              )}

              {showTips === section.key && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase mb-2">Writing Tips</h4>
                  <ul className="space-y-1">
                    {section.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">&#9679;</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Writing Area */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Response {currentDraftNum > 0 && <span className="text-gray-400">(Draft {currentDraftNum})</span>}
                </label>
                <div className={`text-xs font-medium ${
                  wordCount < section.minWords ? 'text-gray-400' :
                  wordCount > section.maxWords ? 'text-red-500 dark:text-red-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {wordCount} / {section.minWords}-{section.maxWords} words
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={currentContent}
                  onChange={(e) => setDrafts(prev => ({ ...prev, [section.key]: e.target.value }))}
                  placeholder={`Type or tap the mic to speak your response... (${section.minWords}-${section.maxWords} words)`}
                  className="w-full h-48 sm:h-64 p-3 sm:p-4 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 text-base sm:text-sm leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <MicrophoneButton
                  onTranscript={(text) => setDrafts(prev => ({ ...prev, [section.key]: prev[section.key] + (prev[section.key] && !prev[section.key].endsWith(' ') ? ' ' : '') + text }))}
                  className="absolute top-3 right-3"
                  showStatus
                />
              </div>

              {error && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex gap-2">
                  {activeSection > 0 && (
                    <button
                      onClick={() => setActiveSection(activeSection - 1)}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  {activeSection < assignment.sections.length - 1 && (
                    <button
                      onClick={() => setActiveSection(activeSection + 1)}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Next Section
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSubmitSection}
                  disabled={submitting || wordCount < Math.floor(section.minWords * 0.5)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    submitting
                      ? 'bg-gray-300 text-gray-500 cursor-wait'
                      : wordCount < Math.floor(section.minWords * 0.5)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : currentFeedback
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Evaluating...
                    </span>
                  ) : currentFeedback ? (
                    'Resubmit for Feedback'
                  ) : (
                    'Submit for AI Coaching'
                  )}
                </button>
              </div>
            </div>

            {/* Feedback Display */}
            {currentFeedback && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    AI Coaching Feedback
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    currentFeedback.score >= courseConfig.thresholds.gradeB ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    currentFeedback.score >= courseConfig.thresholds.gradeC ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {currentFeedback.score}%
                  </div>
                </div>

                {/* Score Trajectory */}
                {scoreHistory[section.key] && scoreHistory[section.key].length > 1 && (
                  <div className="mb-4 flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Progress:</span>
                    {scoreHistory[section.key].map((entry, i) => (
                      <span key={entry.draft} className="flex items-center">
                        <span className={`text-xs font-semibold ${
                          entry.score >= courseConfig.thresholds.gradeB ? 'text-green-600 dark:text-green-400' :
                          entry.score >= courseConfig.thresholds.gradeC ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-orange-600 dark:text-orange-400'
                        }`}>
                          Draft {entry.draft}: {entry.score}%
                        </span>
                        {i < scoreHistory[section.key].length - 1 && (
                          <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        )}
                      </span>
                    ))}
                    {scoreHistory[section.key].length >= 2 && (() => {
                      const scores = scoreHistory[section.key];
                      const diff = scores[scores.length - 1].score - scores[0].score;
                      if (diff > 0) return (
                        <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                          +{diff}% improvement
                        </span>
                      );
                      return null;
                    })()}
                  </div>
                )}

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{currentFeedback.feedback}</p>

                {currentFeedback.strengths.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {currentFeedback.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">&#10003;</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentFeedback.improvements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase mb-2">Suggestions for Improvement</h4>
                    <ul className="space-y-1">
                      {currentFeedback.improvements.map((imp, i) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">&#9679;</span>
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      const msg = `I received this feedback on my "${section.title}" section (Score: ${currentFeedback.score}%):\n\nFeedback: ${currentFeedback.feedback}\n\nAreas to improve: ${currentFeedback.improvements.join('; ')}\n\nCan you help me understand this feedback and how to improve my response?`;
                      setChatInitialMessage(msg);
                      setShowChat(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Ask about this feedback
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Revise and resubmit as many times as you like.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DraftChat
        assignmentId={assignment.assignmentId}
        sectionKey={section.key}
        sectionTitle={section.title}
        currentDraft={currentContent}
        isOpen={showChat}
        onClose={() => { setShowChat(false); setChatInitialMessage(undefined); }}
        onInsertDraft={(text) => setDrafts(prev => ({ ...prev, [section.key]: text }))}
        initialMessage={chatInitialMessage}
      />
    </div>
  );
}
