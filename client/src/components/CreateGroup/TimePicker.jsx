const TimePicker = ({ time, ampm, onTimeChange, onAmPmChange, darkMode }) => {
    const [hour, minute] = (time || "").split(":");

    const handleHourChange = (e) => onTimeChange(`${e.target.value}:${minute}`);
    const handleMinuteChange = (e) => onTimeChange(`${hour}:${e.target.value}`);
    const handleAmPmChange = (e) => onAmPmChange(e.target.value);
    
const selectClasses = `border rounded-lg p-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"} [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`;
    return (
        <div className="flex items-center gap-1">
            <select value={hour} onChange={handleHourChange} className={`${selectClasses} w-10 text-center`}>
                {[...Array(12)].map((_, i) => { const hourValue = (i + 1).toString().padStart(2, '0'); return <option key={hourValue} value={hourValue}>{hourValue}</option>; })}
            </select>
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>:</span>
            <select value={minute} onChange={handleMinuteChange} className={`${selectClasses} w-10 text-center`}>
                 {[...Array(60)].map((_, i) => { const minuteValue = i.toString().padStart(2, '0'); return <option key={minuteValue} value={minuteValue}>{minuteValue}</option>; })}
            </select>
            <select value={ampm} onChange={handleAmPmChange} className={`${selectClasses} w-15`}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
};
export default TimePicker;