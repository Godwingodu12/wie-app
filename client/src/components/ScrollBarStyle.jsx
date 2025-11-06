import React from 'react';

const ScrollBarStyle = ({ isDark }) => {
    // Force boolean conversion
    const darkMode = isDark === true || isDark?.isDark === true;
    
    const trackColor = darkMode ? "#1f2937" : "#f1f1f1";
    const thumbColor = darkMode ? "#4b5563" : "#cbd5e1";
    const thumbHoverColor = darkMode ? "#6b7280" : "#94a3b8";

    React.useEffect(() => {
        console.log('ScrollBarStyle - isDark:', isDark, 'darkMode:', darkMode);
    }, [isDark, darkMode]);

    return (
        <style>{`
            /* Global page scrollbar styling for WebKit browsers */
            body::-webkit-scrollbar,
            html::-webkit-scrollbar,
            .overflow-y-auto::-webkit-scrollbar,
            *::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
                     
            body::-webkit-scrollbar-track,
            html::-webkit-scrollbar-track,
            .overflow-y-auto::-webkit-scrollbar-track,
            *::-webkit-scrollbar-track {
                background: ${trackColor} !important;
            }
                     
            body::-webkit-scrollbar-thumb,
            html::-webkit-scrollbar-thumb,
            .overflow-y-auto::-webkit-scrollbar-thumb,
            *::-webkit-scrollbar-thumb {
                background: ${thumbColor} !important;
                border-radius: 10px;
            }
                     
            body::-webkit-scrollbar-thumb:hover,
            html::-webkit-scrollbar-thumb:hover,
            .overflow-y-auto::-webkit-scrollbar-thumb:hover,
            *::-webkit-scrollbar-thumb:hover {
                background: ${thumbHoverColor} !important;
            }

            /* Firefox scrollbar */
            * {
                scrollbar-width: thin;
                scrollbar-color: ${thumbColor} ${trackColor};
            }
        `}</style>
    );
};

export default ScrollBarStyle;
