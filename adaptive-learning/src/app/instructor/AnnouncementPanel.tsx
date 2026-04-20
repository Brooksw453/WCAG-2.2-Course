'use client';

import { useState, useEffect } from 'react';

interface AnnouncementPanelProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{ id: string; full_name: string; email: string }>;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  announcement_type: string;
  class_id: string | null;
  recipient_id: string | null;
  created_at: string;
}

export default function AnnouncementPanel({ classes, students }: AnnouncementPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [announcementType, setAnnouncementType] = useState<'class' | 'individual'>('class');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [showRecent, setShowRecent] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const [annRes, readRes] = await Promise.all([
        fetch('/api/instructor/announcements'),
        fetch('/api/instructor/announcements/reads'),
      ]);
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
      if (readRes.ok) {
        const data = await readRes.json();
        setReadCounts(data.readCounts || {});
        setTotalStudents(data.totalStudents || 0);
      }
    } catch {
      // silent
    }
    setLoaded(true);
  };

  // Auto-load announcements on mount
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleToggleForm = () => {
    setShowForm(!showForm);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setErrorMsg('Title and body are required.');
      return;
    }
    if (announcementType === 'class' && !selectedClassId) {
      setErrorMsg('Please select a class.');
      return;
    }
    if (announcementType === 'individual' && !selectedStudentId) {
      setErrorMsg('Please select a student.');
      return;
    }

    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/instructor/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: announcementType === 'class' ? selectedClassId : null,
          recipientId: announcementType === 'individual' ? selectedStudentId : null,
          title: title.trim(),
          body: body.trim(),
          type: announcementType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      const data = await res.json();
      setAnnouncements(prev => [data.announcement, ...prev]);
      setTitle('');
      setBody('');
      setSuccessMsg('Announcement sent successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = studentSearch
    ? students.filter(s =>
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;

  const getRecipientLabel = (ann: Announcement) => {
    if (ann.announcement_type === 'class') {
      const cls = classes.find(c => c.id === ann.class_id);
      return cls ? cls.name : 'Class';
    }
    const student = students.find(s => s.id === ann.recipient_id);
    return student ? student.full_name : 'Student';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Announcements</h2>
        </div>
        <button
          onClick={handleToggleForm}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Close' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {/* Recipient type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Send to</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="announcementType"
                  value="class"
                  checked={announcementType === 'class'}
                  onChange={() => setAnnouncementType('class')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Entire Class</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="announcementType"
                  value="individual"
                  checked={announcementType === 'individual'}
                  onChange={() => setAnnouncementType('individual')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Individual Student</span>
              </label>
            </div>
          </div>

          {/* Class or student selector */}
          {announcementType === 'class' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a class...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
              />
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                size={Math.min(filteredStudents.length + 1, 6)}
              >
                <option value="">Select a student...</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="announcement-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              id="announcement-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Body */}
          <div className="mb-4">
            <label htmlFor="announcement-body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea
              id="announcement-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
            />
          </div>

          {errorMsg && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {successMsg}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      )}

      {/* Recent announcements list */}
      {loaded && announcements.length > 0 && (
        <div className="p-4">
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1 hover:text-indigo-600 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showRecent ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Recent Announcements ({announcements.length})
          </button>
          {showRecent && <div className="space-y-2">
            {announcements.slice(0, 10).map(ann => (
              <div key={ann.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-1 sm:gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white break-words">{ann.title}</span>
                  <span className="mx-2 text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block sm:inline">
                    {ann.announcement_type === 'class' ? 'Class: ' : 'To: '}
                    {getRecipientLabel(ann)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {totalStudents > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded font-medium">
                      {readCounts[ann.id] || 0}/{totalStudents} read
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {loaded && announcements.length === 0 && (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No announcements sent yet.
        </div>
      )}
    </div>
  );
}
