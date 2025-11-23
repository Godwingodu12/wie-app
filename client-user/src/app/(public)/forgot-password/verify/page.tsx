'use client';
import { Suspense } from 'react';
import { VerifyResetOTPForm } from '@/components/auth/VerifyResetOTPForm';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
function VerifyContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
          <p className="mt-2 text-gray-600">Enter the code we sent you</p>
        </div>
        <VerifyResetOTPForm />
      </Card>
    </div>
  );
}
export default function VerifyResetOTPPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
export const dynamic = 'force-dynamic';