import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WieLogo from '../../assets/Event/WieLogo.svg';
import BankIcon from '../../assets/Event/BankIcon.svg';
import InfoIcon from '../../assets/Event/InfoIcon.svg';
import MediaIcon from '../../assets/Event/MediaIcon.svg';
import NoteIcon from '../../assets/Event/NoteIcon.svg';
import OrgIcon from '../../assets/Event/OrgIcon.svg';
import PreviewIcon from '../../assets/Event/PreviewIcon.svg';
import TcIcon from '../../assets/Event/T&cIcon.svg';
import BackIcon from '../../assets/Event/BackIcon.svg';

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
            <img src={BackIcon} alt="Back" className={`w-3 h-3 ${!isDarkMode ? 'filter invert' : ''}`} />
        </div>
    </button>
);

const EventSidebar = ({ darkMode = false, formProgress = null, ticketId, groupId, onBackClick ,check}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const {  navigationSteps } = useMemo(() => {
        // --- START OF THE FIX ---
        // Check for the explicit TRUE value of each progress key.
        const useBankingFlow = formProgress?.banking_tickets === true;
        const useAddOnFlow = formProgress?.add_on_events === true || check==true;

        // "Add shows" should only be displayed if that path is active AND the banking path is not.
        // This gives banking_tickets priority.
        const showAddShows = useAddOnFlow && !useBankingFlow ;
        // --- END OF THE FIX ---

        const steps = [
            { id: 1, name: 'Group creation', icon: OrgIcon, route: groupId ? `/ticket/create-group/${groupId}` : '/ticket/create-group' },
            {
                id: 2,
                name: 'Basic information',
                icon: InfoIcon,
                route: (ticketId && groupId)
                    ? `/ticket/create-event/${groupId}/${ticketId}`
                    : (groupId ? `/ticket/create-event/${groupId}` : '#')
            },
            { id: 3, name: 'Media', icon: MediaIcon, route: ticketId ? `/ticket/update-ticket-media/${ticketId}` : '#' },
            showAddShows
                ? { id: 4, name: 'Add shows', icon: NoteIcon, route: ticketId ? `/ticket/update-ticket-addons/${ticketId}` : '#' }
                : { id: 4, name: 'Banking & tickets', icon: BankIcon, route: ticketId ? `/ticket/update-ticket-details/${ticketId}` : '#' },
            { id: 5, name: 'Terms & conditions', icon: TcIcon, route: ticketId ? `/ticket/ticket-terms/${ticketId}` : '#' },
        ];
        
        return { isAddShowFlow: showAddShows, navigationSteps: steps };
    }, [formProgress, ticketId, groupId]);

    const { currentStep, completedSteps } = useMemo(() => {
        let activeStep = 1;
        [...navigationSteps].reverse().forEach(step => {
            const baseRoute = step.route.split('/:')[0];
            if (location.pathname.startsWith(baseRoute) && baseRoute !== '#') {
                if (activeStep === 1 || baseRoute.length > navigationSteps[activeStep - 1].route.split('/:')[0].length) {
                    activeStep = step.id;
                }
            }
        });

        const completed = {
            1: true,
            2: formProgress?.basic_info || false,
            3: formProgress?.media || false,
            4: formProgress?.add_on_events || formProgress?.banking_tickets || false,
            5: formProgress?.terms_conditions || false,
            
        };

        return { currentStep: activeStep, completedSteps: completed };
    }, [location.pathname, formProgress, navigationSteps]);

    const handleBack = onBackClick || (() => navigate('/home'));

    const totalSteps = navigationSteps.length;
let progress = 0;

// Check if the final step (Terms & Conditions) is marked as complete
if (completedSteps[totalSteps]) {
    progress = 100;
} else {
    // Otherwise, progress is based on the step before the current active one.
    // Example: If you are ON step 2, you have completed 1 of 5 steps (20%).
    progress = Math.round(((currentStep - 1) / totalSteps) * 100);
}

const circumference = 2 * Math.PI * 50;
const progressOffset = circumference * (1 - progress / 100);

    return (
        <div className={`hidden lg:flex w-[300px] p-6 flex-col transition-colors duration-300 sticky top-0 h-screen overflow-y-auto main-scrollbar ${darkMode ? 'bg-[#010101]' : 'bg-[F5F5F5]'}`}>
            {/* ... rest of the JSX is unchanged ... */}
            <div className="flex items-center space-x-2 mb-8">
                <img src={WieLogo} alt="Wie Logo" className="w-10 h-10" />
            </div>
            <div className="mb-8">
                <div className="flex items-center space-x-3">
                    <BackButton onClick={handleBack} isDarkMode={darkMode} />
                    <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Create a new event</span>
                </div>
            </div>

            <div className="mb-8 flex justify-center">
                <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="none" className={darkMode ? "text-gray-700" : "text-gray-200"} />
                        <circle
                            cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="none"
                            strokeDasharray={circumference} strokeDashoffset={progressOffset}
                            className={`${darkMode ? "text-[#3EB489]" : "text-[#3EB489]"} transition-all duration-500`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
    {/* FIX: Added text color and increased font size */}
    <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {progress}%
    </span>
    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        completed
    </span>
</div>
                </div>
            </div>

            <nav className="space-y-2">
                {navigationSteps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = completedSteps[step.id];
                    const isAllowed = isCompleted || step.id === 1 || completedSteps[step.id - 1];
                    const hasRoute = step.route !== '#';
                    const isInteractive = isAllowed && hasRoute && step.id !== 1;

                    return (
                        <div
                            key={step.id}
                            className={`flex items-center justify-between -mx-6 px-6 py-3 rounded-lg transition-colors ${
                                isInteractive
                                    ? (darkMode ? 'hover:bg-gray-800 cursor-pointer' : 'hover:bg-gray-100 cursor-pointer')
                                    : 'cursor-not-allowed opacity-60'
                            } ${isActive ? (darkMode ? 'bg-gray-800' : 'bg-[#00000033]') : ''}`}
                            onClick={() => {
                                if (isInteractive) navigate(step.route);
                            }}
                        >
                            <div className="flex items-center space-x-4">
                                <img src={NoteIcon} alt="Step" className={`w-5 h-5 ${ isActive || isCompleted ? 'text-[#3EB489] filter-green' : (darkMode ? 'opacity-30' : ' filter-green')}`} />
                                <span className={`font-medium text-sm ${
                                    isActive || isCompleted ? (darkMode ? 'text-[#3EB489]' : 'text-[#3EB489]') :
                                    (darkMode ? 'text-gray-500' : 'text-gray-400')
                                }`}>
                                    {step.name}
                                </span>
                            </div>
                            <div className={`flex items-center rounded-full w-8 h-8 justify-center ${
                                isActive
                                    ? (darkMode ? 'bg-[#3EB489]' : 'bg-[#3EB489]')
                                    : isCompleted
                                    ? (darkMode ? 'bg-gray-700' : 'bg-green-100')
                                    : (darkMode ? 'bg-gray-800' : 'bg-gray-200')
                            }`}>
                                <img 
                                    src={step.icon} 
                                    alt={step.name} 
                                    className={`w-4 h-4 ${
                                        isActive ? 'filter brightness-0 invert' :
                                        isCompleted ? (darkMode ? 'filter-green' : 'filter-green-dark') :
                                        (darkMode ? 'opacity-100' : 'filter-gray-900')
                                    }`}
                                />
                            </div>
                        </div>
                    );
                })}
            </nav>
            <style>{`
                .filter-green { filter: invert(58%) sepia(56%) saturate(543%) hue-rotate(88deg) brightness(99%) contrast(92%); }
                .filter-green-dark { filter: invert(34%) sepia(27%) saturate(1637%) hue-rotate(89deg) brightness(97%) contrast(91%); }
            `}</style>
        </div>
    );
};

export default EventSidebar;
