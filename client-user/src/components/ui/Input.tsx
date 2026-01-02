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
  className={`relative flex items-center rounded-xl overflow-hidden ${
    error ? "ring-1 ring-red-500" : ""
  }`}
  style={{
    height: "56px",
    background: "#14171a",
  }}
>
  {/* Border layer */}
  {!error && (
    <div
  className="absolute inset-0 rounded-xl pointer-events-none"
  style={{
    background: "#363739",
  }}
>
  <div
    className="absolute inset-[1px] rounded-[10px] bg-[#14171a]"
  />
</div>

  )}

  {icon && (
    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 z-10">
      {icon}
    </div>
  )}

  <input
    {...props}
    className={`
      w-full h-full bg-transparent outline-none
      px-5
      ${icon ? "pl-12" : ""}
      text-white placeholder:text-[#6F7680]
      relative z-10
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
