'use client';

import Image from 'next/image';
import Link from 'next/link';
import AdminIcon from '@/assets/Auth/Admin.svg';

const LoginSignupNavbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 w-full flex items-center justify-end px-3 sm:px-6 py-4 z-50">
      <div className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm text-white/70">
        
        {/* Privacy — desktop only */}
        <Link
          href="/privacy"
          className="hidden sm:inline hover:text-white transition"
        >
          Privacy
        </Link>

        {/* Login */}
        <Link
          href="/login"
          className="hover:text-white transition whitespace-nowrap"
        >
          Login
        </Link>

        {/* Admin pill */}
        <div
          className="
            flex items-center gap-1 sm:gap-2
            px-2 sm:px-4
            py-1 sm:py-1.5
            rounded-xl
            bg-white/10 backdrop-blur
            border border-white/10
            text-white
            whitespace-nowrap
          "
        >
          <Image
            src={AdminIcon}
            alt="Admin"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          />
          <span className="hidden sm:inline">Admin</span>
        </div>
      </div>
    </nav>
  );
};

export default LoginSignupNavbar;
