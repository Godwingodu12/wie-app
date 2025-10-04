import React, { useEffect, useState } from "react";
import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth } from "date-fns";
import  Date_Form_Icon  from "../../assets/Event/Date_Form_Icon.svg?react";
import TimePicker from "./TimePicker";

// Internal SVG components for navigation arrows
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;


const OnlineDatePickerModal = ({ isOpen, onClose, onSave, initialDates, darkMode }) => {
  const [dateType, setDateType] = useState("one-day"); // "one-day" or "multi-day"
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [useSameTime, setUseSameTime] = useState(true);
  const [useSameDetails, setUseSameDetails] = useState(true);
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const preparedDates = (initialDates || []).map(d => ({
        ...d,
        eventLink: d.eventLink || '',
        verificationCode: d.verificationCode || ''
      }));
      setSelectedDates(preparedDates);
      setTimeError("");
    }
  }, [isOpen, initialDates]);

  const handleDateTypeChange = (type) => {
    setSelectedDates([]);
    const typeMap = {
      "Single day": "one-day",
      "Multi days": "multi-day",
      "Weekly": "weekly"
    };
    setDateType(typeMap[type] || type);
  };
  if (!isOpen) return null;

  const convertTo24Hour = (time12h, ampm) => {
    if (!time12h || !ampm) return "";
    const [hours, minutes] = time12h.split(":");
    let hour24 = parseInt(hours, 10);
    if (ampm === "AM" && hour24 === 12) hour24 = 0;
    if (ampm === "PM" && hour24 !== 12) hour24 += 12;
    return `${hour24.toString().padStart(2, "0")}:${minutes}`;
  };

  const validateTime = (startTime, startAmPm, endTime, endAmPm) => {
    if (!startTime || !startAmPm || !endTime || !endAmPm) return true;
    const start24 = convertTo24Hour(startTime, startAmPm);
    const end24 = convertTo24Hour(endTime, endAmPm);
    return new Date(`1970-01-01T${end24}:00`) > new Date(`1970-01-01T${start24}:00`);
  };
    const removeDate = (dateToRemove) => {
    setSelectedDates(prevDates => prevDates.filter(d => d.date !== dateToRemove));
  };
  
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const isSelected = selectedDates.some(d => d.date === dateStr);
      const isCurrentMonthDay = isSameMonth(day, currentMonth);
      const isToday = isSameDay(day, today);
      const isPast = day < today;

      return (
        <div
          key={index}
          onClick={() => !isPast && isCurrentMonthDay && handleDateClick(dateStr)}
          className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors text-sm ${
            isPast || !isCurrentMonthDay ? "text-gray-600 cursor-not-allowed" : "cursor-pointer"
          } ${
            isSelected
              ? "bg-emerald-600 text-white font-bold"
              : isCurrentMonthDay
              ? "hover:bg-gray-700"
              : ""
          } ${
            isToday && !isSelected ? "border border-emerald-500" : ""
          }`}
        >
          {format(day, "d")}
        </div>
      );
    });
  };

  const handleDateClick = (dateStr) => {
    const commonDetails = selectedDates.length > 0 ? {
        startTime: useSameTime ? selectedDates[0].startTime : "",
        endTime: useSameTime ? selectedDates[0].endTime : "",
        startAmPm: useSameTime ? selectedDates[0].startAmPm : "",
        endAmPm: useSameTime ? selectedDates[0].endAmPm : "",
        eventLink: useSameDetails ? selectedDates[0].eventLink : "",
        verificationCode: useSameDetails ? selectedDates[0].verificationCode : "",
    } : { startTime: "", endTime: "", startAmPm: "", endAmPm: "", eventLink: "", verificationCode: "" };
    
    const isAlreadySelected = selectedDates.some(d => d.date === dateStr);
    let newDates;

    if (dateType === 'one-day') {
      newDates = isAlreadySelected ? [] : [{ date: dateStr, endDate: dateStr, ...commonDetails }];
    } else {
      if (isAlreadySelected) {
        newDates = selectedDates.filter(d => d.date !== dateStr);
      } else {
        newDates = [...selectedDates, { date: dateStr, endDate: dateStr, ...commonDetails }];
      }
    }
    setSelectedDates(newDates.sort((a, b) => new Date(a.date) - new Date(b.date)));
  };

  const handleIndividualChange = (index, field, value) => {
    const isTimeField = ['startTime', 'endTime', 'startAmPm', 'endAmPm'].includes(field);
    const useSame = isTimeField ? useSameTime : useSameDetails;
    
    let updatedDates = [...selectedDates];
    if (useSame) {
        updatedDates = updatedDates.map(d => ({ ...d, [field]: value }));
    } else {
        updatedDates[index] = { ...updatedDates[index], [field]: value };
    }

    if (isTimeField) {
        const dateToValidate = useSame ? updatedDates[0] : updatedDates[index];
        if (dateToValidate && !validateTime(dateToValidate.startTime, dateToValidate.startAmPm, dateToValidate.endTime, dateToValidate.endAmPm)) {
            setTimeError("End time must be after start time for the same day.");
        } else {
            setTimeError("");
        }
    }
    setSelectedDates(updatedDates);
  };

  const handleUseSameTimeChange = (e) => {
    const isEnabled = e.target.checked;
    setUseSameTime(isEnabled);
    if (isEnabled && selectedDates.length > 1) {
        const firstDate = selectedDates[0];
        setSelectedDates(selectedDates.map(d => ({ ...d, startTime: firstDate.startTime, endTime: firstDate.endTime, startAmPm: firstDate.startAmPm, endAmPm: firstDate.endAmPm })));
    }
  };

  const handleUseSameDetailsChange = (e) => {
    const isEnabled = e.target.checked;
    setUseSameDetails(isEnabled);
    if (isEnabled && selectedDates.length > 1) {
        const firstDate = selectedDates[0];
        setSelectedDates(selectedDates.map(d => ({ ...d, eventLink: firstDate.eventLink, verificationCode: firstDate.verificationCode })));
    }
  };
  
  const handleSave = () => {
  if (timeError) {
    alert(`Please fix the time error: ${timeError}`);
    return;
  }

  const finalDates = selectedDates.map(d => ({
    date: d.date,
    endDate: d.endDate,
    startTime: convertTo24Hour(d.startTime, d.startAmPm),
    endTime: convertTo24Hour(d.endTime, d.endAmPm),
    eventLink: d.eventLink,
    verificationCode: d.verificationCode
  }));
  onSave(finalDates, dateType);
  onClose();
};

  const handleReset = () => {
    setSelectedDates([]);
    setCurrentMonth(new Date());
  };

 return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl w-full max-w-5xl flex flex-col ${darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
         
              <img src={Date_Form_Icon} alt="" className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>Online Event Scheduler</h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Schedule your dates, times, and links</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Date type:</span>
              {["Single day", "Multi days", "Weekly"].map((type) => {
                  const typeMap = {
                    "Single day": "one-day",
                    "Multi days": "multi-day",
                    "Weekly": "weekly"
                  };
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => handleDateTypeChange(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        dateType === typeMap[type] 
                          ? "bg-emerald-500 text-white" 
                          : `${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
            </div>
            <button type="button" onClick={onClose} className={`text-3xl leading-none ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}>&times;</button>
          </div>
        </div>

        <div className={`border-b ${darkMode ? "border-gray-700" : "border-gray-300"}`}></div>
        
        <div className="flex flex-1 h-[60vh]">
          <div className={`w-1/3 p-4 border-r ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><ChevronLeftIcon /></button>
              <span className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</span>
              <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><ChevronRightIcon /></button>
            </div>
            <div className={`grid grid-cols-7 text-center text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">{generateCalendarDays()}</div>
          </div>
          
          <div className="w-2/3 p-4 flex flex-col min-h-0">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <label className={`flex items-center text-sm cursor-pointer ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <input type="checkbox" checked={useSameTime} onChange={handleUseSameTimeChange} className={`form-checkbox h-4 w-4 rounded border text-indigo-500 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-200 border-gray-400'}`}/>
                    <span className="ml-2">Use same time for all dates</span>
                </label>
                <label className={`flex items-center text-sm cursor-pointer ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <input type="checkbox" checked={useSameDetails} onChange={handleUseSameDetailsChange} className={`form-checkbox h-4 w-4 rounded border text-indigo-500 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-200 border-gray-400'}`}/>
                    <span className="ml-2">Use same Link & Code for all dates</span>
                </label>
            </div>
            
            {/* --- FIX: ADDED A FIXED HEIGHT AND SCROLLBAR CLASS --- */}
            <div className="flex-grow h-[40vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {selectedDates.length > 0 ? selectedDates.map((item, index) => (
                <div key={index} className={`p-3 rounded-lg border space-y-3 ${darkMode ? "bg-black/20 border-gray-700" : "bg-gray-100 border-gray-300"}`}>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-2 rounded-lg text-sm w-32 flex-shrink-0 text-center ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800"}`}>
                        {format(new Date(item.date.replace(/-/g, "/")), "dd/MM/yyyy")}
                    </span>
                    <div className="flex items-center justify-end gap-3 flex-grow">
                        <TimePicker
                            time={item.startTime}
                            ampm={item.startAmPm}
                            onTimeChange={(newTime) => handleIndividualChange(index, 'startTime', newTime)}
                            onAmPmChange={(newAmPm) => handleIndividualChange(index, 'startAmPm', newAmPm)}
                            darkMode={darkMode}
                        />
                        <span className="text-gray-400 text-sm ">to</span>
                        <TimePicker
                            time={item.endTime}
                            ampm={item.endAmPm}
                            onTimeChange={(newTime) => handleIndividualChange(index, 'endTime', newTime)}
                            onAmPmChange={(newAmPm) => handleIndividualChange(index, 'endAmPm', newAmPm)}
                            darkMode={darkMode}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeDate(item.date)}
                        className="p-1.5 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                        aria-label="Remove Date"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <input
                        type="text"
                        value={item.eventLink || ""}
                        onChange={(e) => handleIndividualChange(index, "eventLink", e.target.value)}
                        placeholder="Event Link (e.g., Zoom, YouTube)"
                        className={`w-full border rounded-lg p-2 text-sm placeholder-gray-500 ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                    />
                    <input
                        type="text"
                        value={item.verificationCode || ""}
                        onChange={(e) => handleIndividualChange(index, "verificationCode", e.target.value)}
                        placeholder="Verification Code (Optional)"
                        className={`w-full border rounded-lg p-2 text-sm placeholder-gray-500 ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 pt-16">
                    <p>Select dates from the calendar to get started.</p>
                </div>
              )}
            </div>
            {timeError && <p className="text-red-500 text-sm mt-2 text-center">{timeError}</p>}
          </div>
        </div>

        <div className={`border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}></div>
        <div className="flex justify-end items-center p-4 space-x-4">
            <button type="button" onClick={handleReset} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Reset</button>
            <button type="button" onClick={onClose} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Cancel</button>
            <button type="button" onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white">Save Dates</button>
        </div>
      </div>
    </div>
  );
};

export default OnlineDatePickerModal;