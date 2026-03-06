'use client';

import React, { useState } from 'react';
import { useTheme } from '@/components/home/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, X } from 'lucide-react';
import { updatePersonalDetails } from '@/services/wieUserService';
import { useDispatch } from 'react-redux';
import { updateUser } from '@/features/auth/authSlice';
import TopAlert from '@/components/ui/TopAlert';

export default function PersonalDetailsPage() {
  const { themeStyles, isDark } = useTheme();
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const details = [
    {
      id: 'email',
      label: 'Email',
      value: user?.email || 'Not set',
      type: 'email'
    },
    {
      id: 'contact_no',
      label: 'Phone Number',
      value: user?.contact_no || 'Not set',
      type: 'tel'
    },
    {
      id: 'dob',
      label: 'Date of Birth',
      value: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : 'Not set',
      type: 'date'
    }
  ];

  const handleEditClick = (detail: any) => {
    setEditingField(detail.id);
    if (detail.id === 'dob' && user?.dob) {
      setEditValue(new Date(user.dob).toISOString().split('T')[0]);
    } else {
      setEditValue((user as any)?.[detail.id] || '');
    }
    setError('');
  };

  const handleSave = async () => {
    if (!editingField) return;
    setLoading(true);
    setError('');

    try {
      let payloadValue: any = editValue;
      if (editingField === 'dob' && editValue) {
        payloadValue = new Date(editValue).toISOString();
      } else if (editValue.trim() === '') {
        payloadValue = null;
      }

      // Build the payload based on the field being edited
      const payload: any = {};
      if (editingField === 'dob') payload.dob = payloadValue;
      if (editingField === 'email') payload.email = payloadValue;
      if (editingField === 'contact_no') payload.contact_no = payloadValue;

      const updatedUser = await updatePersonalDetails(payload);
      dispatch(updateUser(updatedUser));
      setEditingField(null);
      setToast({ message: 'Personal details updated successfully', type: 'success' });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Personal details
        </h2>
        <p className="text-sm max-w-2xl" style={{ color: themeStyles.textSecondary }}>
          Wie uses this information to verify your identity and to keep our community safe. You decide what personal details you make visible to others.
        </p>
      </div>

      <div
        className="rounded-3xl overflow-hidden transition-colors duration-300"
        style={{
          background: themeStyles.cardBg,
          border: `1px solid ${themeStyles.border}`
        }}
      >
        {details.map((detail, index) => (
          <div
            key={detail.id}
            onClick={() => handleEditClick(detail)}
            className="flex items-center justify-between p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            style={{
              borderBottom: index !== details.length - 1 ? `1px solid ${themeStyles.divider}` : 'none'
            }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-medium" style={{ color: themeStyles.text }}>
                {detail.label}
              </span>
              <span className="text-[15px]" style={{ color: themeStyles.textSecondary }}>
                {detail.value}
              </span>
            </div>
            <ChevronRight
              size={20}
              style={{ color: themeStyles.textSecondary }}
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
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
              <input
                type={details.find(d => d.id === editingField)?.type || 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={`Enter your ${details.find(d => d.id === editingField)?.label.toLowerCase()}`}
                className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
                style={{
                  background: isDark ? '#1a1a1a' : '#fff',
                  borderColor: themeStyles.border,
                  color: themeStyles.text
                }}
              />
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
