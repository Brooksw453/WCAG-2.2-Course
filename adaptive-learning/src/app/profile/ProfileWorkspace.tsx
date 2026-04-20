'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ProfileWorkspaceProps {
  email: string;
  fullName: string;
  role: string;
  memberSince: string;
  completedSections: number;
  quizAttempts: number;
  assignmentsSubmitted: number;
}

export default function ProfileWorkspace({
  email,
  fullName,
  role,
  memberSince,
  completedSections,
  quizAttempts,
  assignmentsSubmitted,
}: ProfileWorkspaceProps) {
  const router = useRouter();
  const supabase = createClient();

  // Display name editing
  const [displayName, setDisplayName] = useState(fullName);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(fullName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sign out
  const [signingOut, setSigningOut] = useState(false);

  const formattedDate = memberSince
    ? new Date(memberSince).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  async function handleSaveName() {
    if (!nameInput.trim()) {
      setNameMessage({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }
    setNameSaving(true);
    setNameMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNameMessage({ type: 'error', text: 'Not authenticated.' });
      setNameSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nameInput.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      setNameMessage({ type: 'error', text: 'Failed to update name. Please try again.' });
    } else {
      setDisplayName(nameInput.trim());
      setEditingName(false);
      setNameMessage({ type: 'success', text: 'Name updated successfully.' });
    }
    setNameSaving(false);
  }

  async function handleChangePassword() {
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordSaving(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Failed to update password.' });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
    }
    setPasswordSaving(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Your Profile</h1>
                <p className="text-blue-200 text-sm">Manage your account settings</p>
              </div>
            </div>
            <Link
              href="/chapters"
              className="text-sm text-blue-200 hover:text-white transition-colors flex items-center gap-1"
              aria-label="Back to dashboard"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6" role="main">
        {/* Account Info */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <p className="text-gray-900 dark:text-white">{email}</p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-500 mb-1">
                Display Name
              </label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    id="display-name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Edit display name"
                    disabled={nameSaving}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={nameSaving}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    aria-label="Save display name"
                  >
                    {nameSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(displayName);
                      setNameMessage(null);
                    }}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Cancel editing"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 dark:text-white">{displayName || 'Not set'}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-blue-600 text-sm hover:text-blue-700 transition-colors"
                    aria-label="Edit display name"
                  >
                    Edit
                  </button>
                </div>
              )}
              {nameMessage && (
                <p
                  className={`mt-1 text-sm ${nameMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
                  role="status"
                  aria-live="polite"
                >
                  {nameMessage.text}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Role</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 capitalize">
                {role}
              </span>
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member Since</label>
              <p className="text-gray-900 dark:text-white">{formattedDate}</p>
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" aria-labelledby="password-heading">
          <h2 id="password-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum 6 characters"
                minLength={6}
                autoComplete="new-password"
                disabled={passwordSaving}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your new password"
                minLength={6}
                autoComplete="new-password"
                disabled={passwordSaving}
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={passwordSaving || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Update password"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
            {passwordMessage && (
              <p
                className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
                role="status"
                aria-live="polite"
              >
                {passwordMessage.text}
              </p>
            )}
          </div>
        </section>

        {/* Learning Stats */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sections Completed */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center" role="group" aria-label="Sections completed">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedSections}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sections Completed</p>
            </div>

            {/* Quizzes Taken */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 text-center" role="group" aria-label="Quizzes taken">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-purple-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{quizAttempts}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</p>
            </div>

            {/* Assignments Submitted */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center" role="group" aria-label="Assignments submitted">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-green-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignmentsSubmitted}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assignments Submitted</p>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6" aria-labelledby="danger-heading">
          <h2 id="danger-heading" className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Sign out of your account. You will need to log in again to access your learning materials.</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            aria-label="Sign out of your account"
          >
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </section>
      </main>
    </div>
  );
}
