'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NavBar } from '@/components/auth/NavBar';
import { TopAlert } from "@/components/ui/TopAlert";

import BackIcon from '@/assets/forgot-password/BackIcon.svg';
import ResetIcon from '@/assets/forgot-password/ResetIcon.svg';

function ResetContent() {
  const router = useRouter();

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType] = useState<'error' | 'success'>('error');

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white flex flex-col">
      <NavBar />

      {/* TOP ALERT */}
      <TopAlert
        visible={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />

      {/* BACK BUTTON (all screens) */}
            <div className="hidden md:flex px-6 mt-4">
              <button
                onClick={() => router.push("/login")}
                className="w-10 h-10 rounded-full bg-[#1C2024B2]
                           flex items-center justify-center
                           hover:bg-[#2A2F35] transition"
              >
                <Image src={BackIcon} alt="Back" className="w-5 h-5" />
              </button>
            </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">

        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2F2F2F]
                        rounded-2xl sm:rounded-3xl
                        flex items-center justify-center mb-6">
          <Image src={ResetIcon} alt="Reset Password" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
          Reset Password
        </h1>

        <p className="text-center text-sm sm:text-base text-gray-400 mb-6">
          Enter your new password
        </p>

        <ResetPasswordForm
          onError={(msg) => {
            setAlertMessage(msg);
            setShowAlert(true);
          }}
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-[#0a0a0b]">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ResetContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
