'use client';

import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number | null;
  badgeColor?: string;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  badge,
  badgeColor = 'bg-gray-100 text-gray-600',
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          {badge !== null && badge !== undefined && (
            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!isOpen}
      >
        <div className="border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}
