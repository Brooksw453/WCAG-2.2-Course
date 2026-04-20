'use client';

import { useState } from 'react';

interface ClassInfo {
  id: string;
  name: string;
  join_code: string;
  student_count: number;
  created_at: string;
}

export default function ClassManager({ initialClasses }: { initialClasses: ClassInfo[] }) {
  const [classes, setClasses] = useState<ClassInfo[]>(initialClasses);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/instructor/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create class');
      }

      const data = await res.json();
      setClasses(prev => [data.class, ...prev]);
      setNewName('');
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(code: string, classId: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(classId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(classId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Classes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Class'}
        </button>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label htmlFor="new-class-name" className="sr-only">Class name</label>
            <input
              id="new-class-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Class name (e.g., BUS 101 - Spring 2026)"
              aria-label="Class name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
              disabled={creating}
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No classes created yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Create a class and share the join code with your students.</p>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div
              key={cls.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-200 dark:hover:border-indigo-600 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 truncate" title={cls.name}>
                {cls.name}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-bold tracking-wider">
                  {cls.join_code}
                </span>
                <button
                  onClick={() => copyCode(cls.join_code, cls.id)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Copy join code"
                  aria-label="Copy join code"
                >
                  {copiedId === cls.id ? (
                    <span className="text-green-600 font-medium">Copied!</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{cls.student_count} student{cls.student_count !== 1 ? 's' : ''}</span>
                <span>{new Date(cls.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
