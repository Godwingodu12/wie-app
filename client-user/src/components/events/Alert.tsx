import React, { useEffect } from "react";

interface IconProps {
  className?: string;
}

// Success Icon
const SuccessIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.71 12.29l-3.59-3.59L8.11 9.3l2.18 2.18 5.59-5.59L17.29 7.3l-7 7z"
    />
  </svg>
);

// Error Icon
const ErrorIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"
    />
  </svg>
);

// Alert Types
export interface AlertData {
  message: string;
  description?: string;
  type: "success" | "error";
  show: boolean;
}

interface AlertProps {
  alert: AlertData | null;
  onClose: () => void;
  darkMode?: boolean;
}

const Alert: React.FC<AlertProps> = ({ alert, onClose, darkMode = true }) => {
  // Auto hide after 5 seconds
  useEffect(() => {
    if (alert?.show) {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert, onClose]);

  if (!alert?.show) return null;

  const { message, description, type } = alert;
  const isSuccess = type === "success";

  const baseClasses =
    "fixed top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-md p-4 rounded-xl shadow-lg border flex items-center gap-4 z-[100] transition-all duration-300";
  const visibilityClasses = alert.show
    ? "opacity-100 translate-y-0"
    : "opacity-0 -translate-y-10 pointer-events-none";

  let themeClasses: string;
  let descriptionColor: string;
  let closeButtonColor: string;

  // Conditional styling
  if (darkMode) {
    themeClasses = isSuccess
      ? "bg-gradient-to-r from-green-500/20 to-gray-800/10 border-green-500/30 text-white"
      : "bg-gradient-to-r from-red-500/20 to-gray-800/10 border-red-500/30 text-white";
    descriptionColor = "text-gray-300";
    closeButtonColor = "text-gray-400 hover:text-white";
  } else {
    themeClasses = isSuccess
      ? "bg-gradient-to-r from-green-500/10 to-white/90 border-green-600/50 text-gray-900"
      : "bg-gradient-to-r from-red-500/10 to-white/90 border-red-600/50 text-gray-900";
    descriptionColor = "text-gray-600";
    closeButtonColor = "text-gray-600 hover:text-gray-900";
  }

  // Icon color
  const iconClasses = isSuccess
    ? darkMode
      ? "text-green-400"
      : "text-green-600"
    : darkMode
    ? "text-red-400"
    : "text-red-600";

  return (
    <div className={`${baseClasses} ${visibilityClasses} ${themeClasses}`}>
      <div className="flex-shrink-0">
        {isSuccess ? (
          <SuccessIcon className={`w-8 h-8 ${iconClasses}`} />
        ) : (
          <ErrorIcon className={`w-8 h-8 ${iconClasses}`} />
        )}
      </div>

      <div className="flex-grow">
        <p className="font-bold">{message}</p>
        {description && (
          <p className={`text-sm ${descriptionColor}`}>{description}</p>
        )}
      </div>

      <button onClick={onClose} className={`text-2xl font-bold ${closeButtonColor}`}>
        &times;
      </button>
    </div>
  );
};
export { Alert };
