import { courseConfig } from '@/lib/course.config';

const { gradeA, gradeB, gradeC, gradeD } = courseConfig.thresholds;

/** Returns the letter grade (A–F) for a numeric score. */
export function getLetterGrade(score: number): string {
  if (score >= gradeA) return 'A';
  if (score >= gradeB) return 'B';
  if (score >= gradeC) return 'C';
  if (score >= gradeD) return 'D';
  return 'F';
}

/** Returns a Tailwind text-color class for a numeric score (green/yellow/red). */
export function getScoreColor(score: number): string {
  if (score >= gradeB) return 'text-green-600 dark:text-green-400';
  if (score >= gradeC) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/** Returns a Tailwind text-color class for a letter grade. */
export function getGradeColor(letter: string): string {
  switch (letter) {
    case 'A': return 'text-green-600';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-yellow-600';
    case 'D': return 'text-orange-600';
    case 'F': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

/** Returns Tailwind bg + text + border classes for a letter grade badge. */
export function getGradeBg(letter: string): string {
  switch (letter) {
    case 'A': return 'bg-green-100 text-green-800 border-green-200';
    case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'F': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
