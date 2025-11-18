'use client';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Card } from '@/components/ui/Card';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-gray-600">Create a new password</p>
        </div>
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
