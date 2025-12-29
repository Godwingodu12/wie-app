'use client';

import React, { useState } from 'react';
import { getMicrosoftAuthUrl } from '@/services/wieUserService';
import MicrosoftIcon from '@/assets/Auth/MicrosoftLogo.svg';

export const MicrosoftAuthButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      const authUrl = await getMicrosoftAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Microsoft login error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMicrosoftLogin}
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
        src={MicrosoftIcon.src}
        alt="Microsoft"
        className="w-5 h-5"
      />
    </button>
  );
};

export default MicrosoftAuthButton;
