
const DateInformationModal = ({ theme,eventStart,eventEnd, bookingStart, bookingEnd, timeOpen, onClose }) => {
    const bookingPeriod = `${bookingStart} – ${bookingEnd}`;
    const eventPeriod=`${eventStart} – ${eventEnd}`;

    const bgColor = theme.isDark ? '#242424' : '#F1F1F1'; // Dark card background
    const textColor = theme.isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = theme.isDark ? 'text-gray-400' : 'text-gray-600';
    const dividerColor = theme.isDark ? 'border-gray-600' : 'border-gray-300';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
            {/* Modal Content Box */}
            <div 
                className={`rounded-xl shadow-2xl w-full max-w-sm mx-4 ${textColor}`}
                style={{ backgroundColor: bgColor }}
            >
                
                {/* Header */}
                <div className={`p-6 ${dividerColor} flex justify-between items-start`}>
                    <div>
                        <h2 className="text-xl font-semibold">Date Information</h2>
                        <p className={`text-sm mt-1 ${subTextColor}`}>Available dates information</p>
                    </div>
                    <button onClick={onClose} className={`text-gray-400 hover:${textColor} transition-colors`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body Content */}
                <div className="m-6 p-4 rounded-xl border-[#3E4448] space-y-4 border">
                                        <div className="flex justify-between items-center text-base">
                        <span className={subTextColor}>Event Date</span>
                        <span className="font-base">{eventPeriod}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                        <span className={subTextColor}>Booking Period</span>
                        <span className="font-base">{bookingPeriod}</span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                        <span className={subTextColor}>Gate open time</span>
                        <span className="font-medium">{timeOpen}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DateInformationModal;