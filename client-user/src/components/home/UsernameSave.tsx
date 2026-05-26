'use client';

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { updateUser, logoutSuccess } from '@/features/auth/authSlice';
import { setupProfile, logout } from '@/services/wieUserService';
import { User } from '@/types';
import { RootState } from '@/features/store';
import ProfileImage from '@/assets/profile/ProfileImage.jpg';
import { Camera } from 'lucide-react';

interface Props {
  onComplete: (user: User) => void;
}

export const UsernameSave: React.FC<Props> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [username, setUsername] = useState(authUser?.username || '');
  const [name, setName] = useState(authUser?.name || '');
  const [bio, setBio] = useState(authUser?.bio || '');
  const [isPublic, setIsPublic] = useState(authUser?.accountPrivacy !== 'private');

  /* tracks whether user has manually typed in the name field */
  const [isNameEdited, setIsNameEdited] = useState(!!authUser?.name);

  const [preview, setPreview] = useState<string | null>(authUser?.profile_picture || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameErr, setUsernameErr] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Live username validation ── */
  const handleUsernameChange = (val: string) => {
    // Auto-lowercase so what the user sees matches what gets saved
    const lowered = val.toLowerCase();
    setUsername(lowered);
    if (lowered.length > 0 && lowered.length < 4) {
      setUsernameErr('At least 4 characters');
    } else if (lowered.length > 0 && !/^[a-z0-9._]+$/.test(lowered)) {
      setUsernameErr('Only small letters, numbers, . and _ allowed');
    } else {
      setUsernameErr('');
    }

    // Mirror to name field silently — only while user hasn't manually edited it
    if (!isNameEdited) {
      setName(val);
    }
  };

  /* ── Live name validation ── */
  const handleNameChange = (val: string) => {
    setName(val);
    setIsNameEdited(true);
  };

  /* ── Image pick ── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ── Cancel/Close (Logout user) ── */
  const handleCancel = async () => {
    try {
      setLoading(true);
      await logout();
      dispatch(logoutSuccess());
    } catch (err: any) {
      console.error('Logout error:', err);
      dispatch(logoutSuccess());
    } finally {
      setLoading(false);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || usernameErr) {
      setError('Please enter a valid username');
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter a valid name');
      return;
    }

    try {
      setLoading(true);
      const res = await setupProfile({
        username: username.trim(),
        name: name.trim(),
        bio: bio.trim() || undefined,
        accountPrivacy: isPublic ? 'public' : 'private',
        profile_picture: imageFile,
      });

      if (res?.user) {
        dispatch(updateUser(res.user as User));
        onComplete(res.user as User);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-[6px]">
      <div
        className={[
          'relative w-full max-w-[430px] mx-4 rounded-[28px] p-8 flex flex-col gap-6 max-h-[95vh] overflow-y-auto scrollbar-hide',
          /* light */  'bg-white border border-black/[0.06] shadow-[0_10px_40px_rgba(0,0,0,0.12)]',
          /* dark */   'dark:bg-[#18181b] dark:border-white/[0.05] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]',
        ].join(' ')}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center w-full">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Complete profile</h3>
          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            className="absolute right-0 text-zinc-400 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar Picker */}
        <div className="flex justify-center mt-2">
          <div className="relative">
            {/* Circular avatar */}
            <button
              type="button"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
              className="w-28 h-28 rounded-full overflow-hidden bg-zinc-200 dark:bg-[#3f3f46] flex items-center justify-center border border-black/10 dark:border-white/10 hover:opacity-90 transition-opacity disabled:opacity-50 relative"
            >
              {preview ? (
                <img src={preview} alt="avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Image
                  src={ProfileImage}
                  alt="Default user avatar"
                  fill
                  sizes="112px"
                  className="object-cover rounded-full"
                />
              )}
            </button>

            {/* Camera edit badge */}
            <button
              type="button"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 border border-gray-200 dark:border-zinc-600"
            >
              <Camera className="w-4 h-4 text-gray-700 dark:text-zinc-200" />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

          {/* Username Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-zinc-700 dark:text-white/90 pl-1">Username</label>
            <div className="relative">
              <input
                type="text"
                disabled={loading}
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="enter user"
                maxLength={30}
                autoComplete="off"
                className="w-full h-12 rounded-[16px] px-5 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 text-sm transition-all disabled:opacity-50 bg-zinc-100 dark:bg-[#242427]"
                style={{
                  border: usernameErr
                    ? '1.5px solid rgba(239,68,68,0.5)'
                    : username.length >= 4 && !usernameErr
                      ? '1.5px solid rgba(34,197,94,0.4)'
                      : '1.5px solid transparent',
                }}
              />
              {username.length >= 4 && !usernameErr && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400 text-sm">✓</span>
              )}
            </div>
            {usernameErr && (
              <p className="text-xs text-red-500 dark:text-red-400 pl-2">{usernameErr}</p>
            )}
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-zinc-700 dark:text-white/90 pl-1">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={loading}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="enter name"
                maxLength={50}
                autoComplete="off"
                className="w-full h-12 rounded-[16px] px-5 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 text-sm transition-all disabled:opacity-50 bg-zinc-100 dark:bg-[#242427]"
                style={{
                  border: '1.5px solid transparent',
                }}
              />
            </div>
          </div>

          {/* Bio Textarea */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-zinc-700 dark:text-white/90 pl-1">
              Bio
            </label>
            <textarea
              disabled={loading}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Type here.."
              maxLength={160}
              className="w-full h-24 rounded-[18px] px-5 py-3 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 text-sm border border-transparent transition-all resize-none disabled:opacity-50 bg-zinc-100 dark:bg-[#242427]"
            />
          </div>

          {/* Account Privacy Toggle */}
          <div className="flex items-center justify-between py-2 px-1 w-full">
            <span className="text-sm font-semibold text-zinc-700 dark:text-white/90">Make your account public</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsPublic(!isPublic)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 outline-none disabled:opacity-50"
              style={{
                backgroundColor: isPublic ? '#2563eb' : '#a1a1aa',
              }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300"
                style={{
                  transform: isPublic ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div
              className="w-full px-4 py-2.5 rounded-xl text-xs text-red-500 dark:text-red-400 text-center animate-fadeIn bg-red-50 dark:bg-red-500/[0.08] border border-red-200 dark:border-red-500/20"
            >
              {error}
            </div>
          )}

          {/* Buttons Container */}
          <div className="flex items-center justify-between gap-3 mt-4 w-full">
            <button
              type="button"
              disabled={loading}
              onClick={handleCancel}
              className="flex-1 h-11 rounded-full border border-zinc-200 dark:border-white/20 text-zinc-700 dark:text-white font-medium hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-[0.98] transition-all text-sm flex items-center justify-center disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!usernameErr || username.trim().length < 4 || !name.trim() || name.trim().length < 2}
              className="flex-1 h-11 rounded-full text-white font-semibold active:scale-[0.98] transition-all text-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)',
              }}
            >
              {loading ? 'Saving…' : 'next'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UsernameSave;
