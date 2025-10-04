import React from 'react';

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
        </div>
    );
};

export default FormInput;

// You can keep this InfoTooltip here or import it from a shared file
const InfoTooltip = ({ note }) => (
 <div className="relative flex items-center group ml-1.5">
   <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
   </svg>
   <div className="absolute left-full ml-2 w-max max-w-xs p-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
     {note}
   </div>
 </div>
);