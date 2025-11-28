'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Shield, Eye, ChevronRight, CheckCircle, X } from 'lucide-react';

export default function PrivacyPage() {
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      setSuccessMessage(success);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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