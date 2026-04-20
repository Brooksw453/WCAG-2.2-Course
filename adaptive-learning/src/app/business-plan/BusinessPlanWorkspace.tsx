'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import BPDraftChat from './BPDraftChat';
import DownloadPDFButton from '@/components/DownloadPDFButton';
import { courseConfig } from '@/lib/course.config';

interface BusinessPlanProps {
  studentName: string;
  assignments: Array<{
    assignmentId: number;
    title: string;
    sections: Array<{
      key: string;
      title: string;
      content: string;
      score: number | null;
    }>;
  }>;
  savedIntro: string;
  savedSummary: string;
  isSubmitted?: boolean;
}


export default function BusinessPlanWorkspace({
  studentName,
  assignments,
  savedIntro,
  savedSummary,
  isSubmitted: initialSubmitted = false,
}: BusinessPlanProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [execSummary, setExecSummary] = useState(savedSummary);
  const [introduction, setIntroduction] = useState(savedIntro);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showExecChat, setShowExecChat] = useState(false);
  const [showIntroChat, setShowIntroChat] = useState(false);
  const [submitted, setSubmitted] = useState(initialSubmitted);

  // Build part labels dynamically from assignment titles
  const PART_LABELS = useMemo(
    () => assignments.map((a, i) => `Part ${i + 1}: ${a.title}`),
    [assignments]
  );

  const [submitting, setSubmitting] = useState(false);

  // Load from localStorage on mount as fallback
  useEffect(() => {
    if (!execSummary) {
      const stored = localStorage.getItem('bp-exec-summary');
      if (stored) setExecSummary(stored);
    }
    if (!introduction) {
      const stored = localStorage.getItem('bp-introduction');
      if (stored) setIntroduction(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const totalSections = assignments.reduce((sum, a) => sum + a.sections.length, 0);
  const completedSections = assignments.reduce(
    (sum, a) => sum + a.sections.filter((s) => s.content.length > 0).length,
    0
  );

  const canPreview = execSummary.trim().length > 0 && introduction.trim().length > 0;

  const planContent = useMemo(() => {
    return assignments.map((a, ai) =>
      `## ${PART_LABELS[ai]}\n` +
      a.sections.map(s => `### ${s.title}\n${s.content || '[Not yet completed]'}`).join('\n\n')
    ).join('\n\n');
  }, [assignments]);

  const toggleAssignment = (id: number) => {
    setExpandedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setSaveMessage('');

    // Save to localStorage as backup
    localStorage.setItem('bp-exec-summary', execSummary);
    localStorage.setItem('bp-introduction', introduction);

    try {
      // Save to database
      const saveSection = async (sectionKey: string, content: string) => {
        const res = await fetch('/api/business-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionKey, content }),
        });
        if (!res.ok) throw new Error('Save failed');
      };

      await Promise.all([
        saveSection('exec-summary', execSummary),
        saveSection('introduction', introduction),
      ]);

      setSaveMessage('Saved successfully');
    } catch {
      setSaveMessage('Saved to local backup');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [execSummary, introduction]);

  const submitPortfolio = useCallback(async () => {
    setSubmitting(true);
    try {
      // Save drafts first
      await saveDraft();
      // Mark portfolio as submitted
      const res = await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionKey: 'portfolio-submitted', content: 'submitted' }),
      });
      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      setSaveMessage('Failed to submit portfolio');
    } finally {
      setSubmitting(false);
    }
  }, [saveDraft]);

  const handlePreview = useCallback(async () => {
    // Auto-save before entering preview
    await saveDraft();
    setMode('preview');
  }, [saveDraft]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ========== PREVIEW / PRINT MODE ==========
  if (mode === 'preview') {
    return (
      <>
        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; padding: 0; }
            .print-document {
              padding: 0 !important;
              max-width: none !important;
              margin: 0 !important;
            }
            .page-break { page-break-before: always; }
            .cover-page {
              page-break-after: always;
              min-height: 90vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .toc-page { page-break-after: always; }
          }
        `}</style>

        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          {/* Top bar - hidden when printing */}
          <div className="no-print bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => setMode('edit')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Edit
              </button>
              <DownloadPDFButton
                targetSelector="#portfolio-preview"
                filename={`${courseConfig.capstone.labels?.finalTitle?.toLowerCase().replace(/\s+/g, '-') || 'portfolio'}`}
                label="Download PDF"
              />
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {courseConfig.capstone.labels?.printButton || 'Print Portfolio'}
              </button>
            </div>
          </div>

          {/* Document */}
          <div className="print-document max-w-4xl mx-auto px-4 py-8">
            <div id="portfolio-preview" className="bg-white shadow-lg" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>

              {/* Cover Page */}
              <div className="cover-page text-center px-16 py-24">
                <div className="border-b-4 border-navy-800 pb-8 mb-8" style={{ borderColor: '#1e3a5f' }}>
                  <h1 className="text-5xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e3a5f' }}>
                    {courseConfig.capstone.navLabel}
                  </h1>
                </div>
                <div className="mt-12 space-y-4">
                  <p className="text-2xl text-gray-800">{studentName}</p>
                  <p className="text-lg text-gray-600">{courseConfig.title}</p>
                  <p className="text-lg text-gray-600">Adaptive Learning Platform</p>
                  <p className="text-base text-gray-500 mt-8">{currentDate}</p>
                </div>
              </div>

              {/* Table of Contents */}
              <div className="toc-page px-16 py-16">
                <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e3a5f' }}>
                  Table of Contents
                </h2>
                <div className="space-y-3 text-lg">
                  <TocEntry number="I" title="Executive Summary" />
                  <TocEntry number="II" title="Introduction" />
                  {assignments.map((a, ai) => (
                    <div key={a.assignmentId}>
                      <TocEntry number={`${ai + 1}`} title={PART_LABELS[ai]} isMajor />
                      {a.sections.map((s, si) => (
                        <TocEntry key={s.key} number={`${ai + 1}.${si + 1}`} title={s.title} isMinor />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="page-break px-16 py-12">
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e3a5f' }}>
                  I. Executive Summary
                </h2>
                <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                  {execSummary || '[Executive Summary not yet completed]'}
                </div>
              </div>

              {/* Introduction */}
              <div className="px-16 py-12 border-t border-gray-200">
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e3a5f' }}>
                  II. Introduction
                </h2>
                <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                  {introduction || '[Introduction not yet completed]'}
                </div>
              </div>

              {/* Assignment Parts */}
              {assignments.map((a, ai) => (
                <div key={a.assignmentId} className="page-break px-16 py-12">
                  <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e3a5f' }}>
                    {PART_LABELS[ai]}
                  </h2>
                  <p className="text-gray-500 mb-8 text-base italic">{a.title}</p>

                  {a.sections.map((s, si) => (
                    <div key={s.key} className={si > 0 ? 'mt-10' : ''}>
                      <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#2d4a6f' }}>
                        {ai + 1}.{si + 1} {s.title}
                      </h3>
                      {s.content ? (
                        <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                          {s.content}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic text-lg">[Section not yet completed]</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ========== EDIT MODE ==========
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg aria-hidden="true" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{courseConfig.capstone.labels?.yourTitle || 'Your Portfolio'}</h1>
                <p className="text-indigo-200 text-sm">{courseConfig.capstone.labels?.compileDescription || 'Compile your complete portfolio'}</p>
              </div>
            </div>
            <Link
              href="/chapters"
              className="text-sm text-indigo-200 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {completedSections} of {totalSections} assignment sections completed
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              role="progressbar"
              aria-valuenow={totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${completedSections} of ${totalSections} sections completed`}
              style={{ width: `${totalSections > 0 ? (completedSections / totalSections) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Executive Summary</h2>
            {execSummary.trim() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                Done
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {courseConfig.capstone.labels?.summaryPrompt || 'Summarize your key findings and conclusions in a compelling overview.'}
          </p>
          <textarea
            value={execSummary}
            onChange={(e) => setExecSummary(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 text-sm resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={courseConfig.capstone.labels?.summaryPlaceholder || 'Write a compelling summary of your portfolio...'}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">200-500 words recommended</span>
            <span className={`text-xs ${wordCount(execSummary) >= 200 && wordCount(execSummary) <= 500 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {wordCount(execSummary)} words
            </span>
          </div>
          <button
            onClick={() => setShowExecChat(true)}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-2"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Draft with AI
          </button>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Introduction</h2>
            {introduction.trim() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                Done
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {courseConfig.capstone.labels?.introPrompt || 'Introduce your portfolio. What inspired this project? What will the reader learn?'}
          </p>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 text-sm resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={courseConfig.capstone.labels?.introPlaceholder || 'Introduce your portfolio and the journey behind it...'}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">150-300 words recommended</span>
            <span className={`text-xs ${wordCount(introduction) >= 150 && wordCount(introduction) <= 300 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {wordCount(introduction)} words
            </span>
          </div>
          <button
            onClick={() => setShowIntroChat(true)}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-2"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Draft with AI
          </button>
        </div>

        {/* Assignment Sections */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assignment Sections</h2>
        <div className="space-y-3 mb-8">
          {assignments.map((a, ai) => {
            const sectionsDone = a.sections.filter((s) => s.content.length > 0).length;
            const isExpanded = expandedAssignments.has(a.assignmentId);
            const allDone = sectionsDone === a.sections.length;

            return (
              <div key={a.assignmentId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleAssignment(a.assignmentId)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}>
                      {allDone ? (
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        ai + 1
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{PART_LABELS[ai]}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{sectionsDone}/{a.sections.length} sections completed</p>
                    </div>
                  </div>
                  <svg
                    aria-hidden="true"
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 space-y-4">
                    {a.sections.map((s) => (
                      <div key={s.key} className="border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">{s.title}</h4>
                          {s.score !== null && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              s.score >= courseConfig.thresholds.gradeB ? 'bg-green-100 text-green-800' :
                              s.score >= courseConfig.thresholds.gradeC ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {s.score}%
                            </span>
                          )}
                        </div>
                        {s.content ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
                            {s.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Not yet completed</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Draft
              </>
            )}
          </button>

          <button
            onClick={handlePreview}
            disabled={!canPreview}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {courseConfig.capstone.labels?.previewButton || 'Preview Portfolio'}
          </button>

          {canPreview && !submitted && (
            <button
              onClick={submitPortfolio}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Portfolio
                </>
              )}
            </button>
          )}

          {submitted && (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-sm font-medium text-green-700 dark:text-green-400">
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Portfolio Submitted — Certificate Unlocked!
            </span>
          )}

          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}

          {!canPreview && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Fill in the Executive Summary and Introduction to preview and submit
            </span>
          )}
        </div>

        {/* Draft with AI Chat Panels */}
        <BPDraftChat
          sectionType="exec-summary"
          sectionTitle="Executive Summary"
          planContent={planContent}
          isOpen={showExecChat}
          onClose={() => setShowExecChat(false)}
          onInsertDraft={(text) => setExecSummary(text)}
        />
        <BPDraftChat
          sectionType="introduction"
          sectionTitle="Introduction"
          planContent={planContent}
          isOpen={showIntroChat}
          onClose={() => setShowIntroChat(false)}
          onInsertDraft={(text) => setIntroduction(text)}
        />
      </main>
    </div>
  );
}

function TocEntry({ number, title, isMajor, isMinor }: { number: string; title: string; isMajor?: boolean; isMinor?: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 ${isMinor ? 'ml-8 text-base' : ''} ${isMajor ? 'mt-4 font-semibold' : ''}`}>
      <span className="text-gray-500 flex-shrink-0" style={{ minWidth: '2rem' }}>{number}.</span>
      <span className="flex-1 text-gray-800 border-b border-dotted border-gray-300">{title}</span>
    </div>
  );
}
