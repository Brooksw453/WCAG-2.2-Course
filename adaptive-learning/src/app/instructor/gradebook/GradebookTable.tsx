'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StudentGrade {
  id: string;
  full_name: string;
  email: string;
  avgMastery: number | null;
  avgQuiz: number | null;
  avgAssignment: number | null;
  finalGrade: number | null;
  letterGrade: string | null;
}

type SortKey = 'full_name' | 'email' | 'avgMastery' | 'avgQuiz' | 'avgAssignment' | 'finalGrade' | 'letterGrade';
type SortDir = 'asc' | 'desc';

function getGradeColor(letter: string | null): string {
  switch (letter) {
    case 'A': return 'text-green-600';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-yellow-600';
    case 'D': return 'text-orange-600';
    case 'F': return 'text-red-600';
    default: return 'text-gray-400';
  }
}

function getGradeBadge(letter: string | null): string {
  switch (letter) {
    case 'A': return 'bg-green-100 text-green-800 border-green-200';
    case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'F': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

export default function GradebookTable({ students }: { students: StudentGrade[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('full_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * dir;
    }
    return ((aVal as number) - (bVal as number)) * dir;
  });

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1 justify-center">
        {label}
        {sortKey === sortKeyName && (
          <span className="text-blue-600">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div>
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]" role="table" aria-label="Student gradebook">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <SortHeader label="Student Name" sortKeyName="full_name" />
              <SortHeader label="Email" sortKeyName="email" />
              <SortHeader label="Mastery (40%)" sortKeyName="avgMastery" />
              <SortHeader label="Quiz Avg (30%)" sortKeyName="avgQuiz" />
              <SortHeader label="Assignment Avg (30%)" sortKeyName="avgAssignment" />
              <SortHeader label="Final Grade" sortKeyName="finalGrade" />
              <SortHeader label="Letter" sortKeyName="letterGrade" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.map(student => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <Link
                    href={`/instructor/student/${student.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {student.full_name || 'Unknown'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{student.email}</td>
                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                  {student.avgMastery !== null ? `${student.avgMastery}%` : '\u2014'}
                </td>
                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                  {student.avgQuiz !== null ? `${student.avgQuiz}%` : '\u2014'}
                </td>
                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                  {student.avgAssignment !== null ? `${student.avgAssignment}%` : '\u2014'}
                </td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  {student.finalGrade !== null ? `${student.finalGrade}%` : '\u2014'}
                </td>
                <td className="px-4 py-3 text-center">
                  {student.letterGrade ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getGradeBadge(student.letterGrade)}`}>
                      {student.letterGrade}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">{'\u2014'}</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {search ? 'No students match your search.' : 'No students enrolled yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
        Showing {sorted.length} of {students.length} students
      </div>
    </div>
  );
}
