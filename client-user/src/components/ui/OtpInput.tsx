'use client';

import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;

    const otpArray = value.split('');
    otpArray[index] = val;
    const newOtp = otpArray.join('').slice(0, 6);

    onChange(newOtp);

    if (val && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !value[index]) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="w-full flex justify-center gap-2 sm:gap-3 md:gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="
            w-10 h-12
            sm:w-11 sm:h-13
            md:w-12 md:h-14

            text-center
            text-lg sm:text-xl
            font-semibold
            text-white

            bg-transparent
            border border-gray-700
            rounded-lg

            caret-transparent
            focus:border-purple-500
            focus:outline-none
          "
        />
      ))}
    </div>
  );
};

export default OtpInput;
