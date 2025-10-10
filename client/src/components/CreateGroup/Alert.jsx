import React, { useEffect } from 'react';

// Internal Icon components - no need for separate files



const SuccessIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.71 12.29l-3.59-3.59L8.11 9.3l2.18 2.18 5.59-5.59L17.29 7.3l-7 7z" />
    </svg>
);

const ErrorIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z" />
    </svg>
);

const Alert = ({ alert, onClose }) => {
    // Auto-hide the alert after 5 seconds
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [alert, onClose]);

    if (!alert) {
        return null;
    }

    const { message, description, type, show } = alert;
    const isSuccess = type === 'success';

    const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-md p-4 rounded-xl shadow-lg border flex items-center gap-4 z-[100] transition-all duration-300";
    const visibilityClasses = show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none";

    const themeClasses = isSuccess
        ? "bg-gradient-to-r from-green-500/20 to-gray-800/10 border-green-500/30 text-white"
        : "bg-gradient-to-r from-red-500/20 to-gray-800/10 border-red-500/30 text-white";
        
    const iconClasses = isSuccess ? "text-green-400" : "text-red-400";

    return (
        <div className={`${baseClasses} ${visibilityClasses} ${themeClasses}`}>
            <div className="flex-shrink-0">
                {isSuccess ? <SuccessIcon className={`w-8 h-8 ${iconClasses}`} /> : <ErrorIcon className={`w-8 h-8 ${iconClasses}`} />}
            </div>
            <div className="flex-grow">
                <p className="font-bold">{message}</p>
                {description && <p className="text-sm text-gray-300">{description}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>
    );
};



export default Alert;


