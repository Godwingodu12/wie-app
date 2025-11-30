import React from 'react';
import InfoTooltip from './InfoTooltip';

// You'll need to import your InfoTooltip component. Adjust the path if needed.
// For this example, I'll assume it's in the same folder as CreateTicket.jsx
// const InfoTooltip = ({ note }) => ( ... ); // Or import it if it's separate

const FormInput = ({ label, id, name, info, darkMode, error, required, ...props }) => {
    // Define base, default, and error classes
    const baseClasses = "w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300";
    const errorClasses = "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500";
    const defaultClasses = "border-black dark:border-[#4A4A4A] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

    return (
        <div>
            <label htmlFor={id || name} className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
                {info && <InfoTooltip note={info} />}
            </label>
            <input
                id={id || name}
                name={name}
                className={`${baseClasses} ${error ? errorClasses : defaultClasses}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormInput;

// You can keep this InfoTooltip here or import it from a shared file
