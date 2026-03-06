'use client';

import React, { useState, useRef } from 'react';

import { useTheme } from '@/components/home/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, X, Camera } from 'lucide-react';
import { updateProfile, updateAccountPrivacy, updateShowBadge, updateShowSuggestion, getProfile } from '@/services/wieUserService';

import { useDispatch } from 'react-redux';
import { updateUser } from '@/features/auth/authSlice';
import TopAlert from '@/components/ui/TopAlert';
import Image from 'next/image';

export default function ProfileDetailsPage() {
  const { themeStyles, isDark } = useTheme();
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showBadge, setShowBadge] = useState((user as any)?.showBadge || false);
  const [showSuggestion, setShowSuggestion] = useState((user as any)?.showSuggestion || false);

  // Sync toggles with user data
  React.useEffect(() => {
    if (user) {
      setShowBadge((user as any).showBadge || false);
      setShowSuggestion((user as any).showSuggestion || false);
    }
  }, [user]);

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const latestUser = await getProfile();
        if (latestUser) {
          dispatch(updateUser(latestUser));
          setShowBadge((latestUser as any).showBadge || false);
          setShowSuggestion((latestUser as any).showSuggestion || false);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile();
  }, [dispatch]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);



  const getBioList = (bio: string | null | undefined) => {
    if (!bio) return ['Not set'];
    return bio.split('\n').filter(line => line.trim() !== '');
  };

  const currentBioList = getBioList(user?.bio);

  const details = [
    { id: 'name', label: 'Name', value: user?.name || 'Not set', type: 'text' },
    { id: 'username', label: 'Username', value: user?.username ? `@${user.username}` : '@username', type: 'text' },
    { id: 'bio', label: 'Bio', value: user?.bio || 'Not set', type: 'textarea' },
    { id: 'website', label: 'Website', value: (user as any)?.website || 'Not set', type: 'url' },
    { id: 'gender', label: 'Gender', value: (user as any)?.gender || 'Not set', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { id: 'accountPrivacy', label: 'Account privacy', value: user?.accountPrivacy === 'private' ? 'Private' : 'Public', type: 'select', options: ['Public', 'Private'] },
  ];

  const handleEditClick = (detail: any) => {
    setEditingField(detail.id);
    if (detail.id === 'accountPrivacy') {
      setEditValue(user?.accountPrivacy === 'private' ? 'Private' : 'Public');
    } else if (detail.id === 'username') {
      setEditValue(user?.username || '');
    } else if (detail.id === 'website') {
      setEditValue((user as any)?.website || '');
    } else {
      setEditValue((user as any)?.[detail.id] || '');
    }
    setError('');
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const updatedUser = await updateProfile(formData);
      dispatch(updateUser(updatedUser));
      setPreviewUrl(null); // Clear preview after successful upload as user object will have it
      setToast({ message: 'Profile picture updated successfully', type: 'success' });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to upload profile picture');
      setPreviewUrl(null); // Clear preview on error
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    if (!editingField || !user) return;
    setLoading(true);
    setError('');

    try {
      let payloadValue: any = editValue;
      if (editValue.trim() === '') {
        payloadValue = null;
      }

      if (editingField === 'accountPrivacy') {
        const reqPrivacy: 'public' | 'private' = payloadValue === 'Private' ? 'private' : 'public';
        const updatedPrivacyResponse = await updateAccountPrivacy({ accountPrivacy: reqPrivacy });
        if (updatedPrivacyResponse && updatedPrivacyResponse.success) {
           dispatch(updateUser({ ...user, accountPrivacy: reqPrivacy } as any));
           setToast({ message: 'Account privacy updated successfully', type: 'success' });
        }
      } else {
        const payload: any = {};
        if (editingField === 'gender') payload.gender = payloadValue;
        else if (editingField === 'name') payload.name = payloadValue;
        else if (editingField === 'username') {
           payload.username = payloadValue ? payloadValue.replace('@', '') : null;
        }
        else if (editingField === 'website') payload.website = payloadValue;
        else if (editingField === 'bio') payload.bio = payloadValue;

        const updatedUser = await updateProfile(payload);
        dispatch(updateUser(updatedUser));
        setToast({ message: 'Profile updated successfully', type: 'success' });
      }

      setEditingField(null);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to update details');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full max-w-2xl mx-auto pb-12">
      {/* Header section with avatar */}
      <div className="flex flex-col items-center justify-center mt-8 mb-10">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="relative mb-4 cursor-pointer group" onClick={handleCameraClick}>
          <div className="w-24 h-24 rounded-full overflow-hidden relative" style={{ border: `2px solid ${themeStyles.border}` }}>
            {previewUrl || user?.profile_picture ? (
              <Image
                src={previewUrl || user?.profile_picture || ''}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                {user?.name?.charAt(0) || 'A'}
              </div>
            )}
          </div>

          <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-200 p-1.5 rounded-full shadow-md text-blue-500 hover:bg-gray-100 transition-colors">
            <Camera size={16} />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: themeStyles.text }}>
          {user?.name || 'Not set'}
        </h2>
        <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
          {user?.username ? `@${user.username}` : '@username'}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {details.map((detail) => {
          // Special rendering for bio
          if (detail.id === 'bio') {
            return (
              <div key={detail.id} className="flex flex-col">
                <span className="text-sm mb-2 pl-1" style={{ color: themeStyles.textSecondary }}>
                  {detail.label}
                </span>
                <div
                  onClick={() => handleEditClick(detail)}
                  className="rounded-xl overflow-hidden cursor-pointer transition-colors"
                  style={{
                    background: isDark ? '#141414' : '#f9f9f9',
                    border: `1px solid ${themeStyles.border}`
                  }}
                >
                  <div className="p-4 py-5 flex items-center justify-between group">
                    <div className="flex flex-col text-[15px]" style={{ color: themeStyles.text }}>
                      {currentBioList.length === 1 && currentBioList[0] === 'Not set' ? (
                        <span style={{ color: themeStyles.textSecondary }}>Not set</span>
                      ) : (
                        <ul className="list-disc list-inside space-y-0.5">
                          {currentBioList.map((line, idx) => (
                            <li key={idx} className="opacity-90">{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Special insert for elements after 'bio'
          if (detail.id === 'gender') {
            return (
              <React.Fragment key={detail.id}>
                {/* Badge toggle */}
                <div className="flex items-center justify-between py-2 mb-2">
                  <span className="text-[15px]" style={{ color: themeStyles.text }}>
                    Show wie account badge
                  </span>
                  <button
                    onClick={async () => {
                      const newValue = !showBadge;
                      setShowBadge(newValue);
                      try {
                        await updateShowBadge(newValue);
                        dispatch(updateUser({ ...user, showBadge: newValue } as any));
                        setToast({ message: `Badge ${newValue ? 'enabled' : 'disabled'}`, type: 'success' });
                      } catch (err) {
                        setShowBadge(!newValue); // Rollback on error
                        setToast({ message: 'Failed to update badge', type: 'error' });
                      }
                    }}

                    className={`w-12 h-6 rounded-full relative transition-colors ${showBadge ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showBadge ? 'right-1' : 'left-1'}`}
                    />
                  </button>

                </div>

                <div className="flex flex-col">
                  <span className="text-sm mb-2 pl-1" style={{ color: themeStyles.textSecondary }}>
                    {detail.label}
                  </span>
                  <div
                    onClick={() => handleEditClick(detail)}
                    className="rounded-xl overflow-hidden cursor-pointer transition-colors"
                    style={{
                      background: isDark ? '#141414' : '#f9f9f9',
                      border: `1px solid ${themeStyles.border}`
                    }}
                  >
                    <div className="p-4 flex items-center justify-between group">
                      <span className="text-[15px] font-medium" style={{ color: themeStyles.text }}>
                        {detail.value}
                      </span>
                      <ChevronRight
                        size={18}
                        style={{ color: themeStyles.textSecondary }}
                        className="opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          }

          if (detail.id === 'accountPrivacy') {
            return (
              <React.Fragment key={detail.id}>
                {/* Suggestion toggle */}
                <div className="flex items-center justify-between py-2 mb-2">
                  <span className="text-[15px]" style={{ color: themeStyles.text }}>
                    Show wie account suggestion on profile
                  </span>
                  <button
                    onClick={async () => {
                      const newValue = !showSuggestion;
                      setShowSuggestion(newValue);
                      try {
                        await updateShowSuggestion(newValue);
                        dispatch(updateUser({ ...user, showSuggestion: newValue } as any));
                        setToast({ message: `Suggestions ${newValue ? 'enabled' : 'disabled'}`, type: 'success' });
                      } catch (err) {
                        setShowSuggestion(!newValue); // Rollback on error
                        setToast({ message: 'Failed to update suggestions', type: 'error' });
                      }
                    }}

                    className={`w-12 h-6 rounded-full relative transition-colors ${showSuggestion ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showSuggestion ? 'right-1' : 'left-1'}`}
                    />
                  </button>

                </div>

                <div className="flex flex-col">
                  <span className="text-sm mb-2 pl-1" style={{ color: themeStyles.textSecondary }}>
                    {detail.label}
                  </span>
                  <div
                    onClick={() => handleEditClick(detail)}
                    className="rounded-xl overflow-hidden cursor-pointer transition-colors"
                    style={{
                      background: isDark ? '#141414' : '#f9f9f9',
                      border: `1px solid ${themeStyles.border}`
                    }}
                  >
                    <div className="p-4 flex items-center justify-between group">
                      <span className="text-[15px] font-medium" style={{ color: themeStyles.text }}>
                        {detail.value}
                      </span>
                      <ChevronRight
                        size={18}
                        style={{ color: themeStyles.textSecondary }}
                        className="opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          }

          // General input fields
          return (
            <div key={detail.id} className="flex flex-col">
              <span className="text-sm mb-2 pl-1" style={{ color: themeStyles.textSecondary }}>
                {detail.label}
              </span>
              <div
                onClick={() => handleEditClick(detail)}
                className="rounded-xl overflow-hidden cursor-pointer transition-colors"
                style={{
                  background: isDark ? '#141414' : '#f9f9f9',
                  border: `1px solid ${themeStyles.border}`
                }}
              >
                <div className="p-4 flex items-center justify-between group">
                  <span className="text-[15px] font-medium" style={{ color: themeStyles.text }}>
                    {detail.value}
                  </span>
                  <ChevronRight
                    size={18}
                    style={{ color: themeStyles.textSecondary }}
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: themeStyles.text }}>
                Edit {details.find(d => d.id === editingField)?.label}
              </h3>
              <button
                onClick={() => setEditingField(null)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} style={{ color: themeStyles.textSecondary }} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              {details.find(d => d.id === editingField)?.type === 'select' ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                  style={{
                    background: isDark ? '#141414' : '#fff',
                    borderColor: themeStyles.border,
                    color: themeStyles.text
                  }}
                >
                  <option value="" disabled>Select {details.find(d => d.id === editingField)?.label.toLowerCase()}</option>
                  {details.find(d => d.id === editingField)?.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : details.find(d => d.id === editingField)?.type === 'textarea' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={`Enter your ${details.find(d => d.id === editingField)?.label.toLowerCase()}`}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none"
                  style={{
                    background: isDark ? '#141414' : '#fff',
                    borderColor: themeStyles.border,
                    color: themeStyles.text
                  }}
                />
              ) : (
                <input
                  type={details.find(d => d.id === editingField)?.type || 'text'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={`Enter your ${details.find(d => d.id === editingField)?.label.toLowerCase()}`}
                  className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                  style={{
                    background: isDark ? '#141414' : '#fff',
                    borderColor: themeStyles.border,
                    color: themeStyles.text
                  }}
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingField(null)}
                className="px-6 py-2.5 rounded-full font-medium transition-colors"
                style={{ color: themeStyles.textSecondary }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 rounded-full font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      <TopAlert
        message={toast?.message || ''}
        type={toast?.type}
        visible={!!toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
