// src/components/HomePage/ThemeToggle.jsx
import React from 'react';
import DarkIcon from '../../assets/HomePage/DarkIcon.svg';
import LightIcon from '../../assets/HomePage/LightIcon.svg';

const ThemeToggle = ({ isDark, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center rounded-full transition-all duration-300 flex-shrink-0"
      style={{
        width: window.innerWidth < 768 ? '80px' : '92px',
        height: window.innerWidth < 768 ? '40px' : '48px',
        padding: '4px',
        backgroundColor: isDark ? '#212426' : '#e6e6e6',
        border: 'none',
        // Opposite light source directions for dark & light
        boxShadow: isDark
          ? 'inset -4px -4px 8px rgba(255,255,255,0.08), inset 4px 4px 8px rgba(0,0,0,0.6)' // light top-left
          : 'inset 4px 4px 8px rgba(255,255,255,0.8), inset -4px -4px 8px rgba(0,0,0,0.15)', // light bottom-right
      }}
    >
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 lg:px-3">
        <img
          src={LightIcon}
          alt="Light mode"
          style={{
            width: window.innerWidth < 768 ? '14px' : '18px',
            height: window.innerWidth < 768 ? '14px' : '18px',
            opacity: isDark ? 0.4 : 1,
            filter: isDark ? 'brightness(1)' : 'brightness(0.3)',
          }}
        />
        <img
          src={DarkIcon}
          alt="Dark mode"
          style={{
            width: window.innerWidth < 768 ? '14px' : '18px',
            height: window.innerWidth < 768 ? '14px' : '18px',
            opacity: isDark ? 1 : 0.4,
            filter: isDark ? 'brightness(1)' : 'brightness(0.3)',
          }}
        />
      </div>
       
      {/* Slider ("hand") */}
      <div
        className="absolute top-1 flex items-center justify-center rounded-full transition-all duration-300 shadow-md"
        style={{
          width: window.innerWidth < 768 ? '32px' : '40px',
          height: window.innerWidth < 768 ? '32px' : '40px',
          backgroundColor: isDark ? '#2E2E2E' : '#f8f9fa',
          transform: isDark 
            ? `translateX(${window.innerWidth < 768 ? '36px' : '44px'})` 
            : 'translateX(0px)',
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
            width: window.innerWidth < 768 ? '14px' : '18px',
            height: window.innerWidth < 768 ? '14px' : '18px',
            filter: isDark ? 'brightness(1)' : 'brightness(0.2)',
          }}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;