'use client';

import { useState, useEffect, useCallback } from 'react';

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  created_at: string;
  instructor_name: string;
  read?: boolean;
}

interface AnnouncementsProps {
  initialAnnouncements: AnnouncementData[];
}

export default function Announcements({ initialAnnouncements }: AnnouncementsProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    initialAnnouncements.forEach(a => {
      if (a.read) ids.add(a.id);
    });
    return ids;
  });

  const visibleAnnouncements = initialAnnouncements.filter(a => !dismissedIds.has(a.id));
  const unreadCount = visibleAnnouncements.filter(a => !readIds.has(a.id)).length;

  const markAsRead = useCallback(async (announcementId: string) => {
    if (readIds.has(announcementId)) return;
    setReadIds(prev => new Set([...prev, announcementId]));
    try {
      await fetch('/api/announcements/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      });
    } catch {
      // silent - read receipt is best effort
    }
  }, [readIds]);

  const dismissAnnouncement = useCallback((announcementId: string) => {
    setDismissedIds(prev => new Set([...prev, announcementId]));
    // Also mark as read when dismissing
    markAsRead(announcementId);
  }, [markAsRead]);

  // Show limited or all non-dismissed announcements
  const displayedAnnouncements = expanded
    ? visibleAnnouncements
    : visibleAnnouncements.slice(0, 3);

  useEffect(() => {
    displayedAnnouncements.forEach(a => {
      if (!readIds.has(a.id)) {
        markAsRead(a.id);
      }
    });
  }, [displayedAnnouncements, readIds, markAsRead]);

  if (visibleAnnouncements.length === 0) return null;

  const hasMore = visibleAnnouncements.length > 3;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-amber-300 dark:border-amber-600 shadow-sm mb-6">
      <div className="p-4 border-b border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 rounded-t-lg flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-400">Announcements</h2>
        {unreadCount > 0 ? (
          <span className="ml-auto text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full font-medium">
            {unreadCount} new
          </span>
        ) : (
          <span className="ml-auto text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
            {visibleAnnouncements.length} total
          </span>
        )}
      </div>
      <div className="divide-y divide-amber-100 dark:divide-amber-800/30">
        {displayedAnnouncements.map(ann => (
          <div key={ann.id} className="p-3 sm:p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0 break-words">
              {!readIds.has(ann.id) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 mr-2 mb-1">
                  NEW
                </span>
              )}
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{ann.title}</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{ann.body}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">From {ann.instructor_name}</p>
            </div>
            <button
              onClick={() => dismissAnnouncement(ann.id)}
              className="flex-shrink-0 mt-1 p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Dismiss"
              aria-label="Dismiss announcement"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="p-3 border-t border-amber-200 dark:border-amber-700 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-amber-700 hover:text-amber-900 font-medium"
          >
            {expanded ? 'Show less' : `Show ${visibleAnnouncements.length - 3} more`}
          </button>
        </div>
      )}
    </div>
  );
}
