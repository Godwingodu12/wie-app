import React, { useState, useRef, useEffect } from 'react';
import { Country } from '@/types';

interface CountrySelectProps {
  countries: Country[];
  value: string;
  onChange: (countryCode: string) => void;
  required?: boolean;
}

const MAX_VISIBLE_FLAGS = 10;

const CountrySelect = ({
  countries,
  value,
  onChange,
  required = false,
}: CountrySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const getFlagUrl = (code: string) =>
    `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

  const selectedCountry = countries.find(c => c.country_code === value);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Trigger – flag only */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({
              top: rect.bottom + 8,
              left: rect.right + 12, // slightly right
            });
          }
          setIsOpen(v => !v);
        }}
        className="w-7 h-5 flex items-center justify-center rounded-sm bg-black/20"
      >
        {selectedCountry ? (
          <img
            src={getFlagUrl(selectedCountry.country_code)}
            alt="flag"
            className="w-full h-full object-cover rounded-sm"
          />
        ) : (
          <div className="w-full h-full bg-white/10 rounded-sm" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
<div className="absolute top-full mt-3 z-[9999] bg-[#1a1d24] border border-white/10 rounded-lg shadow-xl right-0 translate-x-6">
          {/* Custom scrollbar styles */}
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(226, 178, 178, 0.05);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>

          <div
            className="custom-scrollbar flex flex-col gap-2 p-2 overflow-y-auto"
            style={{
              maxHeight: `${MAX_VISIBLE_FLAGS * 28}px`, // shows ~10 flags
              scrollbarWidth: 'thin',
              scrollbarColor:
                'rgba(255, 255, 255, 0.2) rgba(226, 178, 178, 0.05)',
            }}
          >
            {countries.map(country => (
              <button
                key={country.country_code}
                type="button"
                onClick={() => {
                  onChange(country.country_code);
                  setIsOpen(false);
                }}
                className={`
                  w-9 h-6 flex items-center justify-center
                  rounded-md transition
                  hover:bg-white/10
                  ${value === country.country_code ? 'ring-2 ring-purple-500' : ''}
                `}
              >
                <img
                  src={getFlagUrl(country.country_code)}
                  alt="flag"
                  className="w-full h-full object-cover rounded-sm"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="24"%3E%3Crect width="36" height="24" fill="%23333"/%3E%3C/svg%3E';
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          readOnly
          required
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      )}
    </div>
  );
};
export default CountrySelect;