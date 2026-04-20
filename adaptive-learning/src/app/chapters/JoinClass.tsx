'use client';

import { useState } from 'react';

interface EnrolledClass {
  name: string;
  instructor_name: string;
}

export default function JoinClass({ enrolledClasses }: { enrolledClasses: EnrolledClass[] }) {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join class');
      }

      if (data.alreadyEnrolled) {
        setFeedback({ type: 'success', message: `You're already enrolled in ${data.className}.` });
      } else {
        setFeedback({ type: 'success', message: `Successfully joined ${data.className}!` });
      }

      setJoinCode('');

      // Reload to update enrolled classes display
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to join class',
      });
    } finally {
      setJoining(false);
    }
  }

  const isEnrolled = enrolledClasses.length > 0;

  // Not enrolled: prominent join card
  if (!isEnrolled) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Join a Class</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter the join code from your instructor to enroll in a class.</p>
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label htmlFor="join-code-main" className="sr-only">Join code</label>
              <input
                id="join-code-main"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter join code"
                aria-label="Class join code"
                maxLength={6}
                className="w-full sm:w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-400 font-mono tracking-wider text-center uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                disabled={joining}
              />
              <button
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {joining ? 'Joining...' : 'Join'}
              </button>
            </form>
            {feedback && (
              <p className={`mt-3 text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {feedback.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Enrolled: compact display with option to join another
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">My Classes</h3>
        <button
          onClick={() => setShowJoinForm(!showJoinForm)}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          {showJoinForm ? 'Cancel' : 'Join another class'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {enrolledClasses.map((cls, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 text-sm px-3 py-1 rounded-full"
          >
            {cls.name}
            {cls.instructor_name && (
              <span className="text-blue-400 dark:text-blue-500 text-xs">({cls.instructor_name})</span>
            )}
          </span>
        ))}
      </div>

      {showJoinForm && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label htmlFor="join-code-secondary" className="sr-only">Join code</label>
            <input
              id="join-code-secondary"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Join code"
              aria-label="Class join code"
              maxLength={6}
              className="w-full sm:w-32 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono tracking-wider text-center uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
              autoFocus
              disabled={joining}
            />
            <button
              type="submit"
              disabled={joining || !joinCode.trim()}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </form>
          {feedback && (
            <p className={`mt-2 text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
