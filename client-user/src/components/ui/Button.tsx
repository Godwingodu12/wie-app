import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        font-medium transition-all duration-200
        focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
export default Button;
