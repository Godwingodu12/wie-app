
import React from 'react';

const ScrollBarStyle = ({ isDark }) => {
    // Define colors based on the theme state
    const trackColor = isDark ? "#1f2937" : "#f1f1f1";
    const thumbColor = isDark ? "#4b5563" : "#cbd5e1";
    const thumbHoverColor = isDark ? "#6b7280" : "#94a3b8";

    // Inject the global WebKit scrollbar styles
    return (
        <style global jsx>{`
            /* Global page scrollbar styling for WebKit browsers (Chrome, Safari, Edge) */
            body::-webkit-scrollbar,
            html::-webkit-scrollbar,
            .overflow-y-auto::-webkit-scrollbar {
                width: 8px;
            }
            
            body::-webkit-scrollbar-track,
            html::-webkit-scrollbar-track,
            .overflow-y-auto::-webkit-scrollbar-track {
                background: ${trackColor};
            }
            
            body::-webkit-scrollbar-thumb,
            html::-webkit-scrollbar-thumb,
            .overflow-y-auto::-webkit-scrollbar-thumb {
                background: ${thumbColor};
                border-radius: 10px;
            }
            
            body::-webkit-scrollbar-thumb:hover,
            html::-webkit-scrollbar-thumb:hover,
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                background: ${thumbHoverColor};
            }
        `}</style>
    );
};

export default ScrollBarStyle;