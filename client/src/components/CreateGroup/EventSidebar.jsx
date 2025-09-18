// src/components/Event/EventSidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';  // ✅ Import navigate hook
import WieLogo from '../../assets/Event/WieLogo.svg';
import BankIcon from '../../assets/Event/BankIcon.svg';
import InfoIcon from '../../assets/Event/InfoIcon.svg';
import MediaIcon from '../../assets/Event/MediaIcon.svg';
import NoteIcon from '../../assets/Event/NoteIcon.svg';
import OrgIcon from '../../assets/Event/OrgIcon.svg';
import PreviewIcon from '../../assets/Event/PreviewIcon.svg';
import TcIcon from '../../assets/Event/T&cIcon.svg';
import BackIcon from '../../assets/Event/BackIcon.svg';

// Reusable BackButton
const BackButton = ({ onClick, isDarkMode }) => (
    <button onClick={onClick} className="rounded-full transition-colors">
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
                backgroundColor: isDarkMode ? '#363A3F' : '#F3F4F6',
                boxShadow: isDarkMode
                    ? 'inset 1px 1px 2px #1e2022, inset -1px -1px 2px #4e545c'
                    : 'inset 1px 1px 2px #d1d5db, inset -1px -1px 2px #ffffff',
            }}
        >
            <img src={BackIcon} alt="Back" className={`w-3 h-3 ${!isDarkMode && 'filter invert'}`} />
        </div>
    </button>
);

const EventSidebar = ({ darkMode, progress = 21 }) => {
    const navigate = useNavigate(); 
    const handleBackHome = () => {
        navigate('/home');
    };
    const navigationSteps = [
        { id: 1, name: 'Group creation', icon: OrgIcon, active: true },
        { id: 2, name: 'Basic information', icon: InfoIcon, active: false },
        { id: 3, name: 'Media', icon: MediaIcon, active: false },
        { id: 4, name: 'Banking & tickets', icon: BankIcon, active: false },
        { id: 5, name: 'Terms & conditions', icon: TcIcon, active: false },
        { id: 6, name: 'Preview', icon: PreviewIcon, active: false }
    ];

    const circumference = 2 * Math.PI * 52;
    const progressOffset = circumference * (1 - progress / 100);

    return (
        <div className={`hidden lg:flex w-[300px] p-6 flex-col transition-colors duration-300 sticky top-0 h-screen overflow-y-auto custom-scrollbar ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex items-center space-x-2 mb-8">
                <img src={WieLogo} alt="Wie Logo" className="w-10 h-10" />
            </div>
            <div className="mb-8">
                <div className="flex items-center space-x-3">
                    {/* ✅ Call the handler */}
                    <BackButton onClick={handleBackHome} isDarkMode={darkMode} />
                    <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Create a new event</span>
                </div>
            </div>
                        <div className="mb-8 flex justify-center">
                <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="none" className={darkMode ? "text-gray-700" : "text-gray-200"} />
                        <circle
                            cx="56"
                            cy="56"
                            r="50"
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={progressOffset}
                            className={darkMode ? "text-green-400" : "text-green-500"}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-semibold">{progress}%</span>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>completed</span>
                    </div>
                </div>
            </div>
            <nav className="space-y-2 -mx-6 px-6">
                {navigationSteps.map((step, index) => {
                    const isActive = step.active;
                    const stepIconClass = `w-4 h-4 transition-opacity duration-200 ${index !== 0 ? 'opacity-50' : ''} ${darkMode ? 'filter brightness-0 invert' : ''}`;
                    const iconBgColor = index !== 0 ? (darkMode ? 'rgba(30, 18, 66, 0.5)' : 'rgba(30, 18, 66, 0.5)') : '#1E1242';

                    return (
                        <div
                            key={step.id}
                            className={`flex items-center space-x-3 px-6 py-4 -mx-6 transition-colors rounded-lg
                                ${isActive
                                    ? darkMode ? 'text-white' : 'text-indigo-700'
                                    : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            style={isActive ? { backgroundColor: darkMode ? '#363A3F' : 'rgba(126, 126, 126, 0.2)' } : {}}
                        >
                            <img src={NoteIcon} alt="Note" className={`w-4 h-4 ${!darkMode ? 'filter invert' : ''}`} />
                            <span className="text-sm flex-1">{step.name}</span>
                            <div
                                className="px-3 py-1.5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: iconBgColor }}
                            >
                                <img
                                    src={step.icon}
                                    alt={step.name}
                                    className={stepIconClass}
                                />
                            </div>
                        </div>
                    );
                })}
            </nav>
        </div>
    );
};
export default EventSidebar;
