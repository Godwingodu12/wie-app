import React from 'react';
import DarkIcon from '../assets/HomePage/DarkIcon.svg';
import LightIcon from '../assets/HomePage/LightIcon.svg';

const ThemeToggle = ({ isDark, onToggle }) => {
  console.log('ThemeToggle - isDark:', isDark);

  return (
    <button
      onClick={onToggle}
      className="relative flex items-center rounded-full transition-all duration-300"
      style={{
        width: '92px',
        height: '48px',
        padding: '4px',
        backgroundColor: isDark ? '#212426' : '#e6e6e6',
        border: 'none',
        // ✅ Opposite light source directions for dark & light
        boxShadow: isDark
          ? 'inset -4px -4px 8px rgba(255,255,255,0.08), inset 4px 4px 8px rgba(0,0,0,0.6)' // light top-left
          : 'inset 4px 4px 8px rgba(255,255,255,0.8), inset -4px -4px 8px rgba(0,0,0,0.15)', // light bottom-right
      }}
    >
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-3">
        <img
          src={LightIcon}
          alt="Light mode"
          style={{
            width: '18px',
            height: '18px',
            opacity: isDark ? 0.4 : 1,
            filter: isDark ? 'brightness(1)' : 'brightness(0.3)',
          }}
        />
        <img
          src={DarkIcon}
          alt="Dark mode"
          style={{
            width: '18px',
            height: '18px',
            opacity: isDark ? 1 : 0.4,
            filter: isDark ? 'brightness(1)' : 'brightness(0.3)',
          }}
        />
      </div>

      {/* Slider ("hand") */}
      <div
        className="absolute top-1 flex items-center justify-center rounded-full transition-all duration-300 shadow-md"
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: isDark ? '#2E2E2E' : '#f8f9fa',
          transform: isDark ? 'translateX(44px)' : 'translateX(0px)',
          // Raised effect for the thumb
          boxShadow: isDark
            ? '-4px -4px 8px rgba(255,255,255,0.08), 4px 4px 8px rgba(0,0,0,0.4)'
            : '4px 4px 8px rgba(255,255,255,0.8), -4px -4px 8px rgba(0,0,0,0.15)',
        }}
      >
        <img
          src={isDark ? DarkIcon : LightIcon}
          alt={isDark ? 'Dark mode active' : 'Light mode active'}
          style={{
            width: '18px',
            height: '18px',
            filter: isDark ? 'brightness(1)' : 'brightness(0.2)',
          }}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
