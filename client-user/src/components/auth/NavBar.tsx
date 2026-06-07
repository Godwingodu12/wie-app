'use client';

import Image from 'next/image';
import Link from 'next/link';
import WIELogo from '@/assets/Auth/WieLogo.png';
import AdminIcon from '@/assets/Auth/Admin.svg';

export const NavBar = () => {
  return (
    <nav className="w-full flex items-center justify-between px-3 sm:px-6 py-4">
      
      {/* LEFT: Logo + Text (responsive sizing) */}
      <div className="flex items-center gap-1 min-w-0">
        <Image
          src={WIELogo}
          alt="Wiehive Logo"
          className="w-6 h-6 sm:w-7 sm:h-7"
        />
        <span className="text-white text-sm sm:text-lg font-medium truncate">
          Wiehive
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm text-white/70">
        
        {/* Privacy — desktop only */}
        <Link
          href="/privacy"
          className="hidden sm:inline hover:text-white transition"
        >
          Privacy
        </Link>

        {/* Login — always visible */}
        <Link
          href="/login"
          className="hover:text-white transition whitespace-nowrap"
        >
          Login
        </Link>

        {/* Admin pill — compressed on mobile */}
        <div
          className="
            flex items-center gap-1 sm:gap-2
            px-2 sm:px-4
            py-1
            sm:py-1.5
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
