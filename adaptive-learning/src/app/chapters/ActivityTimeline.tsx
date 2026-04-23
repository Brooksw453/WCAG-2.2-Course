'use client';

import { useState } from 'react';

interface Activity {
  id: string;
  activity_type: string;
  details: Record<string, string | number>;
  created_at: string;
}

interface DayBucket {
  dateKey: string;
  label: string;
  events: number;
  minutes: number;
}

interface ActivityTimelineProps {
  initialActivities: Activity[];
  dayBuckets?: DayBucket[];
  totalLabel?: string;
}

function DailyDensityChart({ buckets, totalLabel }: { buckets: DayBucket[]; totalLabel?: string }) {
  const peakEvents = Math.max(1, ...buckets.map(b => b.events));
  const peakMinutes = Math.max(1, ...buckets.map(b => b.minutes));
  const activeDays = buckets.filter(b => b.events > 0 || b.minutes > 0).length;

  return (
    <div className="px-3 sm:px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Last {buckets.length} days · {activeDays} active
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" aria-hidden="true" />events</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500" aria-hidden="true" />minutes</span>
          {totalLabel && totalLabel !== '—' && <span>total {totalLabel}</span>}
        </div>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}>
        {buckets.map(b => {
          const eventsPct = (b.events / peakEvents) * 100;
          const minutesPct = (b.minutes / peakMinutes) * 100;
          return (
            <div
              key={b.dateKey}
              className="flex flex-col items-center"
              title={`${b.label}: ${b.events} event${b.events !== 1 ? 's' : ''}, ${Math.round(b.minutes)} min`}
            >
              <div className="w-full h-12 sm:h-14 flex items-end gap-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-0.5">
                <div
                  className="flex-1 bg-blue-500 rounded-sm"
                  style={{ height: `${Math.max(b.events > 0 ? 8 : 0, eventsPct)}%` }}
                />
                <div
                  className="flex-1 bg-purple-500 rounded-sm"
                  style={{ height: `${Math.max(b.minutes > 0 ? 8 : 0, minutesPct)}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{b.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getActivityIcon(type: string): React.ReactNode {
  const iconClasses = 'w-4 h-4';
  switch (type) {
    case 'login':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
    case 'section_start':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'section_complete':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'quiz_attempt':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'assignment_submit':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'draft_chat':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'page_view':
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'login': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    case 'section_start': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400';
    case 'section_complete': return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400';
    case 'quiz_attempt': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400';
    case 'assignment_submit': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400';
    case 'draft_chat': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400';
    case 'page_view': return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
  }
}

function getActivityLabel(type: string, details: Record<string, string | number>): string {
  switch (type) {
    case 'login': return 'Logged in';
    case 'section_start': return `Started ${details.section_name || 'a section'}`;
    case 'section_complete': return `Completed ${details.section_name || 'a section'}`;
    case 'quiz_attempt': return `Quiz${details.section_name ? ` ${details.section_name}` : ''} attempt${details.score ? ` — ${details.score}%` : ''}`;
    case 'assignment_submit': return `Submitted ${details.section_name || details.assignment_name || 'assignment section'}`;
    case 'draft_chat': return `Used AI drafting assistant${details.assignment_name ? ` for ${details.assignment_name}` : ''}`;
    case 'page_view': return `Viewed ${details.page || 'a page'}`;
    default: return type;
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupByDate(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();
  activities.forEach(a => {
    const dateKey = new Date(a.created_at).toDateString();
    const list = groups.get(dateKey) || [];
    list.push(a);
    groups.set(dateKey, list);
  });
  return groups;
}

export default function ActivityTimeline({ initialActivities, dayBuckets, totalLabel }: ActivityTimelineProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [activities, setActivities] = useState(initialActivities);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialActivities.length >= 10);

  const displayActivities = collapsed ? activities.slice(0, 10) : activities;
  const grouped = groupByDate(displayActivities);
  const hasDensity = !!dayBuckets && dayBuckets.length > 0;
  const hasAnyData = activities.length > 0 || (hasDensity && dayBuckets!.some(b => b.events > 0 || b.minutes > 0));

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch('/api/activity');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setHasMore(false);
        setCollapsed(false);
      }
    } catch {
      // silent
    }
    setLoadingMore(false);
  };

  if (!hasAnyData) return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
      <div className="p-3 sm:p-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center pb-4 px-4">
        No activity yet. Start learning to see your progress here!
      </p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={!collapsed}
        aria-label="Recent activity timeline"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {activities.length} events
          </span>
          {totalLabel && totalLabel !== '—' && (
            <span className="text-xs text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
              {totalLabel} studied
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div>
          {hasDensity && <DailyDensityChart buckets={dayBuckets!} totalLabel={totalLabel} />}
          <div className="p-3 sm:p-4">
          {activities.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Daily progress is tracked above. Event-level activity will appear here as you move through sections.
            </p>
          )}
          {Array.from(grouped.entries()).map(([dateKey, dateActivities]) => (
            <div key={dateKey} className="mb-4 last:mb-0" role="list" aria-label={formatDateHeader(dateActivities[0].created_at)}>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {formatDateHeader(dateActivities[0].created_at)}
              </div>
              <div className="space-y-2">
                {dateActivities.map(activity => (
                  <div key={activity.id} className="flex items-center gap-2 sm:gap-3" role="listitem">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.activity_type)}`}>
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {getActivityLabel(activity.activity_type, activity.details)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {hasMore && collapsed && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Show more'}
            </button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
