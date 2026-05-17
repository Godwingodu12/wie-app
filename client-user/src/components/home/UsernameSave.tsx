'use client';

import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateUser } from '@/features/auth/authSlice';
import { setupProfile } from '@/services/wieUserService';
import { User } from '@/types';

interface Props {
  onComplete: (user: User) => void;
}

export const UsernameSave: React.FC<Props> = ({ onComplete }) => {
  const dispatch = useDispatch();

  const [username,    setUsername]    = useState('');
  const [preview,     setPreview]     = useState<string | null>(null);
  const [imageFile,   setImageFile]   = useState<File | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
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

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || usernameErr) {
      setError('Please enter a valid username');
      return;
    }

    try {
      setLoading(true);
      const res = await setupProfile({
        username: username.trim(),
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
    /* Backdrop — pointer-events-none on backdrop so nothing behind is clickable */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 rounded-[32px] p-8 flex flex-col items-center gap-6"
        style={{
          background: 'linear-gradient(160deg,rgba(30,20,50,0.98) 0%,rgba(15,12,25,0.99) 100%)',
          border: '1px solid rgba(136,96,217,0.25)',
          boxShadow: '0 0 60px rgba(136,96,217,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1"
            style={{ background: 'linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)' }}
          >
            👋
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome to Wie!</h2>
          <p className="text-sm text-white/50 max-w-[260px]">
            Choose a unique username so others can find you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-[#8860D9]/50 hover:border-[#8860D9] transition group"
              style={{ background: '#1a1040' }}
            >
              {preview ? (
                <img src={preview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full gap-1">
                  <span className="text-2xl">📷</span>
                  <span className="text-[10px] text-white/40">Optional</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="text-white text-xs font-medium">Change</span>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <span className="text-[11px] text-white/30">Profile picture (optional)</span>
          </div>

          {/* Username input */}
          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8860D9] font-semibold text-sm select-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your_username"
                maxLength={30}
                autoComplete="off"
                autoFocus
                className="w-full h-[52px] rounded-full pl-9 pr-5 outline-none text-white placeholder:text-white/25 text-sm"
                style={{
                  background: 'linear-gradient(270deg,rgba(32,32,32,0.6) 0%,rgba(66,66,66,0.6) 100%)',
                  border: usernameErr
                    ? '1.5px solid rgba(239,68,68,0.6)'
                    : username.length >= 4 && !usernameErr
                    ? '1.5px solid rgba(34,197,94,0.5)'
                    : '1.5px solid rgba(136,96,217,0.2)',
                }}
              />
              {/* Live check indicator */}
              {username.length >= 4 && !usernameErr && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 text-sm">✓</span>
              )}
            </div>
            {usernameErr && (
              <p className="text-[11px] text-red-400 pl-2">{usernameErr}</p>
            )}
            <p className="text-[11px] text-white/30 pl-2">
              Letters, numbers, . and _ only · min 4 chars
            </p>
          </div>

          {/* Global error */}
          {error && (
            <div className="w-full px-4 py-2.5 rounded-2xl text-sm text-red-400 text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!usernameErr || username.trim().length < 3}
            className="w-full h-[52px] rounded-full text-white font-semibold text-base transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)',
              boxShadow: '0 0 20px rgba(136,96,217,0.3)',
            }}
          >
            {loading ? 'Saving…' : 'Continue to Wie →'}
          </button>

          <p className="text-center text-[11px] text-white/25">
            You can change this later in your profile settings
          </p>
        </form>
      </div>
    </div>
  );
};

export default UsernameSave;