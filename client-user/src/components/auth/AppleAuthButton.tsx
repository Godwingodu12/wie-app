'use client';

import React, { useState } from 'react';
import { getAppleAuthUrl } from '@/services/wieUserService';
import AppleIcon from '@/assets/Auth/AppleLogo.svg';

export const AppleAuthButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const authUrl = await getAppleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Apple login error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAppleLogin}
      disabled={loading}
      className="
        w-12 h-12
        rounded-full
        flex items-center justify-center
        transition
        hover:brightness-110
        disabled:opacity-60
      "
      style={{ background: '#5D5D5D75' }}
    >
      <img
        src={AppleIcon.src}
        alt="Apple"
        className="w-5 h-5"
      />
    </button>
  );
};

export default AppleAuthButton;
