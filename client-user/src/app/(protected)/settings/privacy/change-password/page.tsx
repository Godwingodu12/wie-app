import React from 'react';
import Link from 'next/link';
import ChangePassword from '@/components/settings/privacy/ChangePassword';

export default function ChangePasswordPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/settings/privacy"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-block"
        >
          ← Back to Privacy & Security
        </Link>
      </div>
      <ChangePassword />
    </div>
  );
}