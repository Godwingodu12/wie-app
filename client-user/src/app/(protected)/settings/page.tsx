'use client';

import React from 'react';
import Link from 'next/link';
import { User, Bell, Shield, Lock, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const settingsOptions = [
    {
      title: 'Personal Details',
      description: 'Manage your profile information',
      icon: User,
      href: '/settings/personal',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      icon: Shield,
      href: '/settings/privacy',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-4">
        {settingsOptions.map((option) => {
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