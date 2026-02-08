'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Shield, Eye, ChevronRight, CheckCircle, X, Globe, Loader2 } from 'lucide-react';
import { getAccountPrivacy, updateAccountPrivacy } from '@/services/wieUserService';

export default function PrivacyPage() {
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [accountPrivacy, setAccountPrivacy] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      setSuccessMessage(success);
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  const fetchAccountPrivacy = async () => {
    try {
      setLoading(true);
      const res = await getAccountPrivacy();
      
      const privacy = res.accountPrivacy || 'public';      
      if (privacy !== 'public' && privacy !== 'private') {
        setAccountPrivacy('public');
      } else {
        setAccountPrivacy(privacy as 'public' | 'private');
      }
    } catch (error) {
      console.error('Failed to fetch account privacy:', error);
      setAccountPrivacy('public');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountPrivacy();
  }, []);
  const handleTogglePrivacy = async () => {
    const newPrivacy = accountPrivacy === 'public' ? 'private' : 'public';
    
    try {
      setUpdating(true);
      const response = await updateAccountPrivacy({ accountPrivacy: newPrivacy });
      
      // ✅ FIXED: Properly extract the accountPrivacy from response
      const updatedPrivacy = response.accountPrivacy || newPrivacy;
      
      // ✅ Validate the response before setting state
      if (updatedPrivacy === 'public' || updatedPrivacy === 'private') {
        setAccountPrivacy(updatedPrivacy as 'public' | 'private');
      } else {
        console.error('Invalid privacy value from API:', updatedPrivacy);
        setAccountPrivacy(newPrivacy); // Fallback to expected value
      }
      
      // ✅ Show different messages based on privacy change
      if (updatedPrivacy === 'private') {
        setSuccessMessage(
          'Your account is now private. New followers will need your approval.'
        );
      } else {
        setSuccessMessage(
          'Your account is now public. All pending follow requests have been automatically accepted.'
        );
      }
    } catch (error: any) {
      console.error('Failed to update account privacy:', error);
      alert(error.response?.data?.message || 'Failed to update account privacy');
      // ✅ Revert state on error
      await fetchAccountPrivacy();
    } finally {
      setUpdating(false);
    }
  };

  const privacyOptions = [
    {
      title: 'Change Password',
      description: 'Update your account password',
      icon: Lock,
      href: '/settings/privacy/change-password',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      icon: Shield,
      href: '/settings/privacy/two-factor',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Privacy Settings',
      description: 'Control who can see your information',
      icon: Eye,
      href: '/settings/privacy/visibility',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link
          href="/settings"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Settings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy & Security</h1>
        <p className="text-gray-600">Manage your account security and privacy</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-green-600 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Account Privacy Toggle */}
      <div className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="bg-indigo-50 p-3 rounded-lg">
              {accountPrivacy === 'private' ? (
                <Lock className="w-6 h-6 text-indigo-600" />
              ) : (
                <Globe className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Account Privacy
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {accountPrivacy === 'private' 
                  ? 'Your account is private. Only approved followers can see your posts.'
                  : 'Your account is public. Anyone can see your posts and follow you.'}
              </p>
              
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <button
                  onClick={handleTogglePrivacy}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    updating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : accountPrivacy === 'private'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {updating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </span>
                  ) : accountPrivacy === 'private' ? (
                    'Switch to Public'
                  ) : (
                    'Switch to Private'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {privacyOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link
              key={option.href}
              href={option.href}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`${option.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
