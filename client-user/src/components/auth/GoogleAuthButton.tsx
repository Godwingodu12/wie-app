'use client';

import React, { useState } from 'react';
import { getGoogleAuthUrl } from '@/services/wieUserService';
import GoogleIcon from "@/assets/Auth/GoogleLogo.svg";

export const GoogleAuthButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const authUrl = await getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google login error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="
        w-12 h-12
        rounded-full
        flex items-center justify-center
        transition
        disabled:opacity-60
      "
      style={{ background: '#5D5D5D75' }}
    >
      <img
        src={GoogleIcon.src}
        alt="Google"
        className="w-5 h-5"
      />
    </button>
  );
};

export default GoogleAuthButton;
