import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-1">
          {label}
        </label>
      )}

      <div
        className={`
          relative flex items-center
          h-[56px]
          rounded-full
          overflow-hidden
          backdrop-blur-md
          ${error ? "ring-1 ring-red-500/70" : ""}
        `}
        style={{
          background:
            "linear-gradient(270deg, rgba(32, 32, 32, 0.5) 0%, rgba(66, 66, 66, 0.5) 100%)",
        }}
      >
        {icon && (
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}

        <input
          {...props}
          className={`
            w-full h-full
            bg-transparent
            outline-none
            text-white
            placeholder:text-[#6F7680]
            px-5
            ${icon ? "pl-12" : ""}
            ${className}
          `}
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
