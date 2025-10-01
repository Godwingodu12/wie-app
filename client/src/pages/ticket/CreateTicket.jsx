import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { format } from "date-fns";
import Select from 'react-select';
import {
  createTicketBasicInfo,
  getGroups,
  getTicketById,
} from "../../services/ticketService";

// Import shared components
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";


// --- Reusable UI Components ---
const CustomScrollbarStyles = ({ isDark }) => {
  const mainTrackColor = isDark ? "#232426" : "#f1f5f9";
  const mainThumbColor = isDark ? "#4f4f4f" : "#cbd5e1";
  const widgetThumbColor = isDark ? "#818cf8" : "#6366f1";

  const autofillTextColor = isDark ? '#FFFFFF' : '#1F2937';

  return (
    <style>{`
      /* --- ADD THIS FOR THE MAIN BROWSER SCROLLBAR --- */
      body::-webkit-scrollbar {
        width: 12px;
      }
      body::-webkit-scrollbar-track {
        background: #232426;
      }
      body::-webkit-scrollbar-thumb {
        background-color: #4f4f4f;
        border-radius: 20px;
        border: 3px solid #232426;
      }
      /* --- END OF NEW SCROLLBAR CODE --- */

      .main-scrollbar::-webkit-scrollbar { width: 8px; }
      .main-scrollbar::-webkit-scrollbar-track { background: ${mainTrackColor}; }
      .main-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${mainThumbColor};
        border-radius: 10px;
        border: 2px solid ${mainTrackColor};
      }
      .main-scrollbar { scrollbar-width: thin; scrollbar-color: ${mainThumbColor} ${mainTrackColor}; }
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${widgetThumbColor};
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      .custom-scrollbar { scrollbar-width: thin; scrollbar-color: ${widgetThumbColor} transparent; }
      
      input[type="time"]::-webkit-datetime-edit-text,
      input[type="time"]::-webkit-datetime-edit-hour-field,
      input[type="time"]::-webkit-datetime-edit-minute-field {
        color: transparent;
      }
      input[type="time"]:focus::-webkit-datetime-edit-text,
      input[type="time"]:focus::-webkit-datetime-edit-hour-field,
      input[type="time"]:focus::-webkit-datetime-edit-minute-field,
      input[type="time"]:not(:placeholder-shown)::-webkit-datetime-edit-text,
      input[type="time"]:not(:placeholder-shown)::-webkit-datetime-edit-hour-field,
      input[type="time"]:not(:placeholder-shown)::-webkit-datetime-edit-minute-field {
        color: inherit;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
          -webkit-text-fill-color: ${autofillTextColor} !important;
          background-color: transparent !important;
          -webkit-box-shadow: none !important;
          transition: background-color 9999s ease-in-out 0s;
      }

    `}</style>
  );
};

const InfoTooltip = ({ note }) => (
  <div className="relative flex items-center group ml-1.5">
    <svg
      className="w-4 h-4 text-blue-400"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      ></path>
    </svg>
    <div className="absolute left-full ml-2 w-max max-w-xs p-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
      {note}
    </div>
  </div>
);

const ToggleSwitch = ({ label, checked, onChange, darkMode }) => (
  <div className="flex items-center justify-between w-full">
    <span
      className={`flex items-center text-sm font-medium ${
        darkMode ? "text-gray-300" : "text-gray-700"
      }`}
    >
      {label}
    </span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
          darkMode
            ? "bg-gray-600 after:border-gray-500 peer-checked:bg-indigo-600"
            : "bg-gray-300 after:border-gray-200 peer-checked:bg-indigo-500"
        }`}
      ></div>
    </label>
  </div>
);

const TagInput = ({ label, tags, onTagsChange, placeholder, darkMode }) => {
  const [inputValue, setInputValue] = useState("");
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onTagsChange([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };
  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div>
      <label
        className={`flex items-center text-sm font-medium ${
          darkMode ? "text-gray-400" : "text-gray-500"
        } mb-2`}
      >
        {label} <InfoTooltip note="Press Enter to add a tag." />
      </label>
      <div
        className={`flex flex-wrap items-center gap-2 p-2 bg-transparent border rounded-lg ${
          darkMode ? "border-[#4A4A4A]" : "border-gray-300"
        }`}
      >
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 px-3 py-1 rounded-full text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-400 dark:text-indigo-300 hover:text-indigo-600 dark:hover:text-white font-bold"
            >
              ×
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 bg-transparent focus:outline-none p-1 ${
            darkMode
              ? "text-white placeholder-gray-500"
              : "text-gray-800 placeholder-gray-400"
          }`}
        />
      </div>
    </div>
  );
};
const DatePickerModal = ({
  isOpen,
  onClose,
  onSave,
  initialDates,
  darkMode,
}) => {
  const [dateType, setDateType] = useState("Single day");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState(initialDates || []);
  const [useSameTime, setUseSameTime] = useState(true);
  
  useEffect(() => {
    setSelectedDates(initialDates || []);
  }, [initialDates]);

  const handleDateTypeChange = (type) => {
    setSelectedDates([]);
    setDateType(type);
  };

  if (!isOpen) return null;

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h, ampm) => {
    if (!time12h || !ampm) return '';
    
    const [hours, minutes] = time12h.split(':');
    let hour24 = parseInt(hours);
    
    if (ampm === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (ampm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  // Helper function to convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24h) => {
    if (!time24h) return { time: '', ampm: '' };
    
    const [hours, minutes] = time24h.split(':');
    let hour12 = parseInt(hours);
    const ampm = hour12 >= 12 ? 'PM' : 'AM';
    
    if (hour12 === 0) {
      hour12 = 12;
    } else if (hour12 > 12) {
      hour12 -= 12;
    }
    
    return {
      time: `${hour12.toString().padStart(2, '0')}:${minutes}`,
      ampm: ampm
    };
  };

  // Helper function to validate time
  const validateTime = (startTime, endTime, startAmPm, endAmPm) => {
    if (!startTime || !endTime || !startAmPm || !endAmPm) return true; // Allow incomplete times
    
    const start24 = convertTo24Hour(startTime, startAmPm);
    const end24 = convertTo24Hour(endTime, endAmPm);
    
    if (!start24 || !end24) return true;
    
    const start = new Date(`1970-01-01T${start24}:00`);
    const end = new Date(`1970-01-01T${end24}:00`);
    
    return end > start;
  };

  // Helper function to show time validation error
  const showTimeValidationError = () => {
    alert("Error: End time must be after start time for same-day events. Please select a valid time range.");
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let days = [];
    for (
      let i = 0;
      i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
      i++
    ) {
      days.push(<div key={`blank-${i}`} className="h-10 w-10"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = format(date, "yyyy-MM-dd");
      const isSelected = selectedDates.some((d) => d.date === dateStr);
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;

      days.push(
        <div
          key={day}
          onClick={() => !isPast && handleDateClick(dateStr)}
          className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors
                                ${
                                  isPast
                                    ? "text-gray-600 cursor-not-allowed"
                                    : "cursor-pointer"
                                }
                                ${
                                  isSelected
                                    ? "bg-emerald-500 text-white"
                                    : "hover:bg-gray-700"
                                }
                                ${
                                  isToday && !isSelected
                                    ? "border border-emerald-500"
                                    : ""
                                }`}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  const handleDateClick = (dateStr) => {
    const commonTime =
      selectedDates.length > 0 && useSameTime
        ? {
            startTime: selectedDates[0].startTime,
            endTime: selectedDates[0].endTime,
            startAmPm: selectedDates[0].startAmPm,
            endAmPm: selectedDates[0].endAmPm,
          }
        : { startTime: "", endTime: "", startAmPm: "", endAmPm: "" };

    switch (dateType) {
      case "Single day": {
        const isSelected = selectedDates.some((d) => d.date === dateStr);
        if (isSelected) {
          setSelectedDates([]);
        } else {
          // For single day events, both start_date and end_date should be the same
          setSelectedDates([{ 
            date: dateStr, 
            endDate: dateStr, // Set end_date to same as start_date
            ...commonTime 
          }]);
        }
        break;
      }
      case "Multi days": {
        const isSelected = selectedDates.some((d) => d.date === dateStr);
        let newDates;
        if (isSelected) {
          newDates = selectedDates.filter((d) => d.date !== dateStr);
        } else {
          // For multi-day events, each day is independent
          newDates = [...selectedDates, { 
            date: dateStr, 
            endDate: dateStr, // Each day has same start and end date
            ...commonTime 
          }];
        }
        setSelectedDates(
          newDates.sort((a, b) => new Date(a.date) - new Date(b.date))
        );
        break;
      }
      case "Weekly": {
        const clickedDate = new Date(dateStr.replace(/-/g, "/"));
        const dayOfWeek = clickedDate.getDay();
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const datesForDayOfWeek = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          if (date.getDay() === dayOfWeek && date >= today) {
            const dayDateStr = format(date, "yyyy-MM-dd");
            datesForDayOfWeek.push({
              date: dayDateStr,
              endDate: dayDateStr, // Each day has same start and end date
              ...commonTime,
            });
          }
        }
        const isDaySelected = selectedDates.some(
          (d) => new Date(d.date.replace(/-/g, "/")).getDay() === dayOfWeek
        );
        setSelectedDates(isDaySelected ? [] : datesForDayOfWeek);
        break;
      }
    }
  };

  const handleIndividualTimeChange = (index, field, value) => {
    if (useSameTime) {
      // When "Use same time" is enabled, update all dates
      const updatedDates = selectedDates.map((d) => ({ ...d, [field]: value }));
      
      // Only validate when both time and ampm are set for both start and end
      if (field === 'endAmPm' || (field === 'endTime' && updatedDates[0].endAmPm) ||
          field === 'startAmPm' || (field === 'startTime' && updatedDates[0].startAmPm)) {
        
        const currentDate = updatedDates[0];
        const startTime = field === 'startTime' ? value : currentDate.startTime;
        const endTime = field === 'endTime' ? value : currentDate.endTime;
        const startAmPm = field === 'startAmPm' ? value : currentDate.startAmPm;
        const endAmPm = field === 'endAmPm' ? value : currentDate.endAmPm;
        
        // Only validate if we have complete time information
        if (startTime && endTime && startAmPm && endAmPm && 
            !validateTime(startTime, endTime, startAmPm, endAmPm)) {
          showTimeValidationError();
          return; // Don't update if validation fails
        }
      }
      
      setSelectedDates(updatedDates);
    } else {
      // When disabled, update only the specific date
      const updatedDates = [...selectedDates];
      updatedDates[index][field] = value;
      
      // Only validate when both time and ampm are set for both start and end
      if (field === 'endAmPm' || (field === 'endTime' && updatedDates[index].endAmPm) ||
          field === 'startAmPm' || (field === 'startTime' && updatedDates[index].startAmPm)) {
        
        const currentDate = updatedDates[index];
        const startTime = field === 'startTime' ? value : currentDate.startTime;
        const endTime = field === 'endTime' ? value : currentDate.endTime;
        const startAmPm = field === 'startAmPm' ? value : currentDate.startAmPm;
        const endAmPm = field === 'endAmPm' ? value : currentDate.endAmPm;
        
        // Only validate if we have complete time information
        if (startTime && endTime && startAmPm && endAmPm && 
            !validateTime(startTime, endTime, startAmPm, endAmPm)) {
          showTimeValidationError();
          return; // Don't update if validation fails
        }
      }
      
      setSelectedDates(updatedDates);
    }
  };

  // Handle "Use same time" toggle
  const handleUseSameTimeChange = (e) => {
    const isEnabled = e.target.checked;
    setUseSameTime(isEnabled);
    
    if (isEnabled && selectedDates.length > 0) {
      // Auto-fill all dates with the first date's time
      const firstDateTime = selectedDates[0];
      if (firstDateTime.startTime || firstDateTime.endTime) {
        // Only validate if we have complete time information
        if (firstDateTime.startTime && firstDateTime.endTime && 
            firstDateTime.startAmPm && firstDateTime.endAmPm &&
            !validateTime(firstDateTime.startTime, firstDateTime.endTime, 
                           firstDateTime.startAmPm, firstDateTime.endAmPm)) {
          showTimeValidationError();
          return;
        }
        
        setSelectedDates(currentDates =>
          currentDates.map(d => ({
            ...d,
            startTime: firstDateTime.startTime || d.startTime,
            endTime: firstDateTime.endTime || d.endTime,
            startAmPm: firstDateTime.startAmPm || d.startAmPm,
            endAmPm: firstDateTime.endAmPm || d.endAmPm,
          }))
        );
      }
    }
  };

  const handleSave = () => {
    // Validate all dates before saving
    for (let i = 0; i < selectedDates.length; i++) {
      const dateEntry = selectedDates[i];
      // Only validate if we have complete time information
      if (dateEntry.startTime && dateEntry.endTime && 
          dateEntry.startAmPm && dateEntry.endAmPm &&
          !validateTime(dateEntry.startTime, dateEntry.endTime, 
                         dateEntry.startAmPm, dateEntry.endAmPm)) {
        showTimeValidationError();
        return; // Don't save if validation fails
      }
    }

    // Convert 12-hour format to 24-hour format for backend
    const convertedDates = selectedDates.map(dateEntry => ({
      ...dateEntry,
      startTime: dateEntry.startTime && dateEntry.startAmPm ? 
                 convertTo24Hour(dateEntry.startTime, dateEntry.startAmPm) : dateEntry.startTime,
      endTime: dateEntry.endTime && dateEntry.endAmPm ? 
               convertTo24Hour(dateEntry.endTime, dateEntry.endAmPm) : dateEntry.endTime,
      // Keep the original 12-hour format for display purposes
      startTime12h: dateEntry.startTime,
      endTime12h: dateEntry.endTime,
      startAmPm: dateEntry.startAmPm,
      endAmPm: dateEntry.endAmPm
    }));

    onSave(convertedDates, dateType);
    onClose();
  };

  const handleReset = () => {
    setSelectedDates([]);
    setCurrentMonth(new Date());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-4xl flex flex-col ${
          darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              📅
            </div>
            <div>
              <h3
                className={`font-bold text-lg ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                Event Calendar
              </h3>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Schedule your events date and time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Date type:
              </span>
              {["Single day", "Multi days", "Weekly"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleDateTypeChange(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    dateType === type
                      ? "bg-emerald-500 text-white"
                      : `${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`text-3xl leading-none ${
                darkMode
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              ×
            </button>
          </div>
        </div>
        <div
          className={`border-b ${
            darkMode ? "border-gray-600" : "border-gray-300"
          }`}
        ></div>
        <div className="flex flex-1 h-[60vh]">
          <div className="w-1/2 p-4">
            <div
              className={`flex items-center justify-between mb-4 p-2 border rounded-lg ${
                darkMode
                  ? "text-gray-300 border-gray-600 bg-gray-700/50"
                  : "text-gray-700 border-gray-300 bg-gray-100/50"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                }`}
              >
                {"<"}
              </button>
              <span className="font-semibold text-lg">
                {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                }`}
              >
                {">"}
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs uppercase mb-2">
              {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((day) => (
                <span
                  key={day}
                  className={darkMode ? "text-gray-400" : "text-gray-500"}
                >
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 place-items-center text-center gap-1">
              {generateCalendarDays()}
            </div>
          </div>
          <div
            className={`border-l ${
              darkMode ? "border-gray-600" : "border-gray-300"
            }`}
          ></div>
          <div className="w-1/2 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <label
                className={`flex items-center text-sm cursor-pointer ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={useSameTime}
                  onChange={handleUseSameTimeChange}
                  className={`form-checkbox h-4 w-4 rounded border-gray-600 focus:ring-emerald-500 ${
                    darkMode
                      ? "bg-gray-700 text-emerald-500"
                      : "bg-gray-200 text-emerald-600"
                  }`}
                />
                <span className="ml-2">Use same time for all dates</span>
              </label>
            </div>
            <div className="h-[40vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {selectedDates.map((item, index) => {
                const formattedDate = format(
                  new Date(item.date.replace(/-/g, "/")),
                  "dd/MM/yyyy"
                );
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className={`px-3 py-2 rounded-lg text-sm w-32 flex-shrink-0 text-center ${
                        darkMode
                          ? "bg-gray-700 text-gray-200"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {formattedDate}
                    </span>
                    
                    {/* Start Time Fields */}
                    <div className="flex gap-1 w-full">
                      <input
                        type="time"
                        value={item.startTime || ""}
                        onChange={(e) =>
                          handleIndividualTimeChange(index, "startTime", e.target.value)
                        }
                        className={`border rounded-lg p-2 text-sm flex-1 ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                      <select
                        value={item.startAmPm || ""}
                        onChange={(e) =>
                          handleIndividualTimeChange(index, "startAmPm", e.target.value)
                        }
                        className={`border rounded-lg p-2 text-sm w-16 ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">-</option>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>

                    <span className="text-gray-400 text-sm">to</span>

                    {/* End Time Fields */}
                    <div className="flex gap-1 w-full">
                      <input
                        type="time"
                        value={item.endTime || ""}
                        onChange={(e) =>
                          handleIndividualTimeChange(index, "endTime", e.target.value)
                        }
                        className={`border rounded-lg p-2 text-sm flex-1 ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                      <select
                        value={item.endAmPm || ""}
                        onChange={(e) =>
                          handleIndividualTimeChange(index, "endAmPm", e.target.value)
                        }
                        className={`border rounded-lg p-2 text-sm w-16 ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">-</option>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDateClick(item.date)}
                      className={`p-1 rounded-full ${
                        darkMode
                          ? "text-red-500 hover:bg-gray-700"
                          : "text-red-600 hover:bg-gray-200"
                      }`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div
          className={`border-t ${
            darkMode ? "border-gray-600" : "border-gray-300"
          }`}
        ></div>
        <div className="flex justify-end items-center p-4 space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
const GuestModal = ({
  isOpen,
  onClose,
  onSave,
  initialGuests,
  editingGuest: initialEditingGuest,
  darkMode,
}) => {
  const [localGuests, setLocalGuests] = useState(initialGuests || []);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [photo, setPhoto] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);

  useEffect(() => {
    if (initialEditingGuest) {
      setEditingGuest(initialEditingGuest);
      setName(initialEditingGuest.name);
      setLink(initialEditingGuest.link || "");
      setPhoto(null);
    }
  }, [initialEditingGuest]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setLink("");
    setPhoto(null);
    setEditingGuest(null);
  };

  const handleFormSubmit = () => {
    if (!name.trim()) return;
    if (editingGuest) {
      setLocalGuests(
        localGuests.map((g) =>
          g.id === editingGuest.id
            ? {
                ...g,
                name: name.trim(),
                link: link.trim(),
                image: photo ? URL.createObjectURL(photo) : g.image,
                rawFile: photo || g.rawFile,
              }
            : g
        )
      );
    } else {
      const newGuest = {
        id: Date.now(),
        name: name.trim(),
        link: link.trim(),
        image: photo
          ? URL.createObjectURL(photo)
          : `https://i.pravatar.cc/150?u=${Date.now()}`,
        rawFile: photo,
      };
      setLocalGuests([...localGuests, newGuest]);
    }
    resetForm();
  };

  const handleDeleteGuest = (guestId) => {
    setLocalGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  const startEditing = (guest) => {
    setEditingGuest(guest);
    setName(guest.name);
    setLink(guest.link || "");
    setPhoto(null);
  };

  const handleSave = () => {
    onSave(localGuests);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-4xl flex flex-col ${
          darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              👤
            </div>
            <div>
              <h3
                className={`font-bold text-lg ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                {editingGuest ? "Edit Guest" : "Add Guest/Guide/Artists"}
              </h3>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Manage your event's featured people.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-3xl leading-none ${
              darkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            ×
          </button>
        </div>
        <div
          className={`border-b ${
            darkMode ? "border-gray-600" : "border-gray-300"
          }`}
        ></div>
        <div className="flex p-4 h-[500px]">
          <div className="w-1/2 pr-4 flex flex-col">
            <div className="space-y-4">
              <div>
                <label
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } text-sm`}
                >
                  Guest/Guide name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Enter name"
                  className={`w-full mt-1 p-2 border rounded-lg ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } text-sm`}
                >
                  Profile link (Optional)
                </label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  type="text"
                  placeholder="https://..."
                  className={`w-full mt-1 p-2 border rounded-lg ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Guest/Guide Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className={`w-full text-sm mt-1 p-2 border rounded-lg file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                    darkMode
                      ? "border-gray-600 file:bg-indigo-500/20 file:text-indigo-300"
                      : "border-gray-300 file:bg-indigo-100 file:text-indigo-700"
                  }`}
                />
              </div>
            </div>
            <div className="mt-auto flex justify-end pt-4">
              <button
                type="button"
                onClick={handleFormSubmit}
                className={`px-6 py-2 font-semibold rounded-lg flex items-center gap-2 ${
                  editingGuest
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {editingGuest ? "Update Guest" : "Add Guest +"}
              </button>
            </div>
          </div>
          <div
            className={`border-l ${
              darkMode ? "border-gray-600" : "border-gray-300"
            }`}
          ></div>
          <div className="w-1/2 pl-4 flex flex-col min-h-0">
            <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar h-full">
              {localGuests.length > 0 ? (
                localGuests.map((g) => (
                  <div
                    key={g.id}
                    className={`${
                      darkMode ? "bg-gray-700/50" : "bg-gray-100"
                    } rounded-lg p-3 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={g.image}
                        alt={g.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="truncate">
                        <p
                          className={`font-semibold truncate ${
                            darkMode ? "text-white" : "text-black"
                          }`}
                        >
                          {g.name}
                        </p>
                        {g.link && (
                          <a
                            href={g.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 truncate block"
                          >
                            {g.link}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(g)}
                        className={`p-2 ${
                          darkMode
                            ? "text-gray-400 hover:text-white"
                            : "text-gray-500 hover:text-black"
                        }`}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGuest(g.id)}
                        className={`p-2 ${
                          darkMode
                            ? "text-red-400 hover:text-red-300"
                            : "text-red-500 hover:text-red-700"
                        }`}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 pt-16">
                  No guests added yet.
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          className={`border-t ${
            darkMode ? "border-gray-600" : "border-gray-300"
          }`}
        ></div>
        <div className="flex justify-end items-center p-4 space-x-4">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const ProhibitedItemsModal = ({
  isOpen,
  onClose,
  onSave,
  initialItems,
  darkMode,
}) => {
  const [selectedItems, setSelectedItems] = useState(initialItems || []);
  const [customItem, setCustomItem] = useState("");
  const suggestions = [
    "Umbrellas",
    "Wooden sticks",
    "Power bank",
    "Helmets",
    "Glass containers",
    "Laptops",
    "Laser pointer/Flashlight",
    "Outside food",
    "Alcohol",
    "Music instrument",
    "Toxics",
    "Chemicals",
    "Camera",
    "Selfie sticks",
    "Metal containers",
    "Bags",
    "Flammable",
    "Banners",
    "Cans",
    "Tins",
    "Bottles",
  ];

  if (!isOpen) return null;
  const toggleItem = (item) =>
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  const handleAddCustom = () => {
    if (customItem.trim() && !selectedItems.includes(customItem.trim())) {
      setSelectedItems((prev) => [...prev, customItem.trim()]);
      setCustomItem("");
    }
  };
  const handleSave = () => {
    onSave(selectedItems);
    onClose();
  };
  const handleReset = () => {
    setSelectedItems([]);
    setCustomItem("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-3xl flex flex-col ${
          darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              🚫
            </div>
            <div>
              <h3
                className={`font-bold text-lg ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                Add prohibited items
              </h3>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Add items that are not allowed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`text-3xl leading-none ${
              darkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div
            className={`min-h-[80px] rounded-lg p-3 flex flex-wrap gap-2 border ${
              darkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-gray-100/50 border-gray-200"
            }`}
          >
            {selectedItems.map((item) => (
              <div
                key={item}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm h-fit ${
                  darkMode
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`font-bold text-lg leading-none ${
                    darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                type="text"
                placeholder="Enter the name here..."
                className={`w-full pl-3 pr-10 py-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              />
              <div
                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                *
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCustom}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2"
            >
              Add <span className="text-xl">+</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {suggestions.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => toggleItem(item)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {item} <span className="text-lg">+</span>
              </button>
            ))}
          </div>
        </div>
        <div
          className={`flex justify-end items-center p-4 mt-2 space-x-4 border-t ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <button
            type="button"
            onClick={handleReset}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};



// --- NEW: Language options array ---
const eventCategories = {
    "Arts, Culture, & Literature": [ "Art Exhibitions", "Cultural Festivals", "Theater Performances", "Literature Festivals", "Historical Reenactments", "Art Installations", "Art Workshops & Competitions", "Guided Art Walks", "Printmaking & Conceptual Art", "Residency Showcases", "Art Auctions" ],
    "Music": [ "Concerts", "Music Festivals", "Live Performances", "Battle of the Bands", "DJ Nights" ],
    "Entertainment & Performing Arts": [ "Comedy Shows", "Magic Shows", "Circus Performances" ],
    "Dance": [ "Recitals & Showcases", "Competitions & Galas", "Social Dance Nights", "Dance Workshops", "Themed Dances", "Classical Dance", "Contemporary Dance", "Street & Urban Dance", "Bollywood & Tollywood Dance", "Folk & Traditional Dance", "K-pop Dance" ],
    "Sports, Fitness, & Adventure": [ "Sporting Competitions", "Marathons & Races", "Fitness Workshops", "Adventure Sports", "Camping & Hiking", "Turf Booking", "Esports" ],
    "Education & Learning": [ "Workshops & Seminars", "Conferences & Summits", "Academic Competitions & MUNs", "Career Fairs & Counseling", "Public Lectures", "Bootcamps", "Certification Programs", "College Fests", "Webinars", "Startup Competitions", "Quiz Sessions" ],
    "Business & Innovation": [ "Tech Expos", "Hackathons", "Product Launches", "Robotics Competitions", "Trade Shows", "Networking Events" ],
    "Food, Lifestyle, & Wellness": [ "Food Festivals", "Wine Tastings", "Cooking Classes", "Yoga & Spiritual Retreats", "Mindfulness Workshops", "Fashion Shows" ],
    "Film, Media, & Gaming": [ "Film Festivals & Screenings", "Animation Showcases", "Board Game Nights", "Cosplay Conventions" ],
    "Travel, Holidays, & Tourism": [ "Travel Expos", "Destination Showcases", "Cruise Events", "Holiday Events (e.g., Halloween, Christmas)" ],
    "Festivals & Celebrations": [ "National & Regional Festivals", "Harvest Festivals", "Lantern Festivals", "Cultural Parades", "Religious Festivals" ],
    "Environment, Sustainability, & Agriculture": [ "Eco-Festivals", "Sustainable Living Workshops", "Tree-Planting & Clean Energy Campaigns", "Agricultural Fairs & Farmers' Markets", "Green Hackathons", "Cyclothons", "Eco-Tourism Trails", "Green Tech Conferences" ],
    "Religious & Spiritual Events": [ "Pilgrimages", "Spiritual Retreats", "Meditation Camps" ]
};

const languageOptions = ['English','Hindi','Malayalam','Tamil','Kannada','Telugu','Marathi','Gujarati','Punjabi','Urdu','Bengali','Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Russian','Turkish','Korean', 'Portuguese', 'Arabic','Indonesian','Vietnamese','Other'].map(lang => ({ value: lang, label: lang }));
// Add these constants near your other dropdown data arrays
const ageOptions = [
    { value: "0", label: "All ages" },
    { value: "13", label: "13+" },
    { value: "16", label: "16+" },
    { value: "18", label: "18+" },
    { value: "21", label: "21+" }
];

const seatingOptions = [
    { value: "seated", label: "Seated" },
    { value: "standing", label: "Standing" },
    { value: "seated and standing", label: "Seated and Standing" },
    { value: "other", label: "Other" }
];
const customSelectStyles = (isDark) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'transparent',
    borderColor: state.isFocused ? '#6366F1' : (isDark ? '#4A4A4A' : '#D1D5DB'),
    padding: '0.5rem',
    borderRadius: '0.5rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#6366F1',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0 2px',
  }),
  input: (provided) => ({
    ...provided,
    color: isDark ? '#FFFFFF' : '#1F2937',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: isDark ? '#FFFFFF' : '#1F2937',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDark ? '#6B7280' : '#9CA3AF',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDark ? '#2B2B2B' : '#FFFFFF',
    borderRadius: '0.5rem',
    zIndex: 50,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? (isDark ? '#374151' : '#E5E7EB') : 'transparent',
    color: isDark ? '#FFFFFF' : '#1F2937',
    '&:active': {
      backgroundColor: '#4338CA',
    },
  }),
  menuList: (provided) => ({
    ...provided,
    '::-webkit-scrollbar': { width: '8px' },
    '::-webkit-scrollbar-track': { background: isDark ? '#232426' : '#f1f5f9' },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: isDark ? '#4f4f4f' : '#cbd5e1',
      borderRadius: '10px',
      border: `2px solid ${isDark ? '#232426' : '#f1f5f9'}`,
    },
  }),
});
const CreateTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId, ticketId: urlTicketId } = useParams();
  const queryTicketId = new URLSearchParams(location.search).get("ticketId");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isProhibitedModalOpen, setIsProhibitedModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const storageKey = `ticketFormData_${groupId || "new"}`;
  const rulesEditorRef = useRef(null);
  const descriptionEditorRef = useRef(null);

  // --- NEW: Data structure for event categories and subcategories ---


  // Set initial map location (Thrissur, Kerala, India)
  const INITIAL_MAP_LOCATION = {
    lat: 10.5276,
    lng: 76.2144,
    address: "Thrissur, Kerala, India"
  };

  const [formData, setFormData] = useState({
    _id: null,
    event_name: "",
    event_category: "",
    event_subcategory: "",
    event_type: "public",
    location_type: "offline",
    event_link: "",
    location: "",
    venue: "",
    event_language: "",
    min_age_allowed: "0",
    seating_arrangement: "",
    kids_friendly: false,
    pet_friendly: false,
    event_instagram_link: "",
    event_youtube_link: "",
    hashtag: [],
    event_dates: [],
    event_date_type: "Single day",
    gatesOpenEarly: false,
    gate_open_time: "",
    gate_open_hour: "", // Initialize as empty
    gate_open_minute: "", // Initialize as empty
    gate_open_ampm: "", // Initialize as empty
    guests: [],
    event_rules: { type: "text", content: "" },
    event_rules_file: null,
    prohibited_items: [],
    POCS: [],
    event_description: "",
    exact_map_location: { 
      latitude: INITIAL_MAP_LOCATION.lat.toString(), 
      longitude: INITIAL_MAP_LOCATION.lng.toString(), 
      address: INITIAL_MAP_LOCATION.address 
    },
    groupId: groupId || "",
  });


  const [poc, setPoc] = useState({
    POC_name: "",
    POC_email: "",
    POC_contact: "",
  });
          const categoryOptions = Object.keys(eventCategories).map(category => ({
        value: category,
        label: category
    }));
    const subCategoryOptions = formData.event_category 
        ? eventCategories[formData.event_category].map(sub => ({ value: sub, label: sub }))
        : [];

  const saveFormDataToStorage = (data) => {
    try {
      const { ...dataToSave } = data; // File objects can't be stored
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  };

  const loadFormDataFromStorage = () => {
    try {
      const savedData = localStorage.getItem(storageKey);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      localStorage.removeItem(storageKey); // Clear corrupted data
      return null;
    }
  };

  const clearFormDataFromStorage = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing data from localStorage:", error);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    return new Date(timeString).toTimeString().slice(0, 5);
  };

  const loadExistingTicketData = async (ticketIdParam) => {
    try {
      if (!ticketIdParam) return null;
      const ticketResponse = await getTicketById(ticketIdParam);
      let ticketData =
        ticketResponse?.data ||
        ticketResponse?.ticket ||
        ticketResponse?.result ||
        ticketResponse;

      if (!ticketData) {
        const savedFormData = loadFormDataFromStorage();
        if (savedFormData) setFormData(savedFormData);
        return savedFormData || null;
      }
      
      // Helper function to format date for input (ISO to YYYY-MM-DD)
      const formatDateForInput = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return date.toISOString().split('T')[0]; // This gives YYYY-MM-DD format
      };

      // Helper function to format time for input
      const formatTimeForInput = (timeString) => {
        if (!timeString) return '';
        return timeString;
      };

      // When loading existing ticket data
      const event_dates = ticketData.event_dates
        ? ticketData.event_dates.map((d) => ({
            date: formatDateForInput(d.start_date), // This will be in YYYY-MM-DD format
            endDate: formatDateForInput(d.end_date), // Add end_date support
            startTime: formatTimeForInput(d.start_time),
            endTime: formatTimeForInput(d.end_time),
          })) : [];

      let eventLanguage = "";
      if (Array.isArray(ticketData.event_language)) {
        eventLanguage = ticketData.event_language[0] || "";
      } else {
        eventLanguage = ticketData.event_language || "";
      }

      const loadedData = {
        event_name: ticketData.event_name || "",
        event_category: ticketData.event_category || "",
        event_subcategory: ticketData.event_subcategory || "",
        event_type: ticketData.event_type || "public",
        location_type: ticketData.location_type || "offline",
        event_link: ticketData.event_link || "",
        location: ticketData.location || "",
        venue: ticketData.venue || "",
        event_language: eventLanguage,
        min_age_allowed: ticketData.min_age_allowed?.toString() || "",
        seating_arrangement: ticketData.seating_arrangement || "",
        kids_friendly: ticketData.kids_friendly || false,
        pet_friendly: ticketData.pet_friendly || false,
        event_instagram_link: ticketData.event_instagram_link || "",
        event_youtube_link: ticketData.event_youtube_link || "",
        hashtag: ticketData.hashtag || [],
        event_dates: event_dates,
        event_date_type:
          ticketData.event_date_type === "one-day"
            ? "Single day"
            : ticketData.event_date_type === "weekly"
            ? "Weekly"
            : "Multi days",
        gate_open_time: formatTimeForInput(ticketData.gate_open_time) || "",
        gatesOpenEarly: !!ticketData.gate_open_time,
        // Parse gate opening time into separate fields
        gate_open_hour: ticketData.gate_open_time ? (() => {
          const time = new Date(`1970-01-01T${ticketData.gate_open_time}`);
          let hour = time.getHours();
          return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        })() : "",
        gate_open_minute: ticketData.gate_open_time ? (() => {
          const time = new Date(`1970-01-01T${ticketData.gate_open_time}`);
          return time.getMinutes().toString().padStart(2, "0");
        })() : "",
        gate_open_ampm: ticketData.gate_open_time ? (() => {
          const time = new Date(`1970-01-01T${ticketData.gate_open_time}`);
          return time.getHours() >= 12 ? "PM" : "AM";
        })() : "",
        guests: ticketData.guests || [],
        event_rules: ticketData.event_rules || { type: "text", content: "" },
        prohibited_items: ticketData.prohibited_items || [],
        POCS: ticketData.POCS || [],
        event_description: ticketData.event_description || "",
        exact_map_location: {
          latitude: ticketData.exact_map_location?.latitude?.toString() || INITIAL_MAP_LOCATION.lat.toString(),
          longitude: ticketData.exact_map_location?.longitude?.toString() || INITIAL_MAP_LOCATION.lng.toString(),
          address: ticketData.exact_map_location?.address || INITIAL_MAP_LOCATION.address,
        },
        groupId: ticketData.groupId || groupId || "",
      };

      setFormData(loadedData);
      saveFormDataToStorage(loadedData);
      setIsEditMode(true);
      return ticketData;
    } catch (error) {
      console.error("Error loading existing ticket:", error);
      const savedFormData = loadFormDataFromStorage();
      if (savedFormData) setFormData(savedFormData);
      return savedFormData || null;
    }
  };
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (formData.event_name || formData.location) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);
  
  useEffect(() => {
    const initializeComponent = async () => {
      setPageLoading(true);
      if (!groupId) {
        navigate("/select-group");
        return;
      }

      try {
        const groupsResponse = await getGroups();
        const groupsArray = Array.isArray(groupsResponse)
          ? groupsResponse
          : groupsResponse.data || [];
        const groupData = groupsArray.find((g) => g._id === groupId);
        if (!groupData) {
          alert("Group not found.");
          navigate("/select-group");
          return;
        }
        setSelectedGroup(groupData);

        if (urlTicketId) {
          setIsEditMode(true);
          await loadExistingTicketData(urlTicketId);
        } else {
          if (location.state?.formData) {
            setFormData(location.state.formData);
            saveFormDataToStorage(location.state.formData);
          } else {
            const savedData = loadFormDataFromStorage();
            if (savedData) {
              setFormData(savedData);
            }
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setPageLoading(false);
      }
    };
    initializeComponent();
  }, [groupId, urlTicketId, navigate, location.state]);
  
  useEffect(() => {
    if (!pageLoading && !isEditMode) {
      saveFormDataToStorage(formData);
    }
  }, [formData, pageLoading, isEditMode]);

  useEffect(() => {
    const callbackName = "initMapCallback";
    window[callbackName] = () => setIsApiReady(true);
    const scriptId = "google-maps-script";
    
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB5MQdwuxFIG6Msf_At0bV2vPXuFwEkVkI&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.google) {
      setIsApiReady(true);
    }
    
    return () => {
      delete window[callbackName];
    };
  }, []);

  // Enhanced map initialization with initial location
  useEffect(() => {
    if (!isApiReady || !mapRef.current || !dataLoaded) return;

    // If location type is not offline, cleanup and return
    if (formData.location_type !== 'offline') {
      if (map) {
        setMap(null);
        markerRef.current = null;
      }
      return;
    }

    const initializeMap = () => {
      // Use form data coordinates if available, otherwise use initial location
      const initialCenter = formData.exact_map_location.latitude && formData.exact_map_location.longitude
        ? {
            lat: parseFloat(formData.exact_map_location.latitude),
            lng: parseFloat(formData.exact_map_location.longitude),
          }
        : INITIAL_MAP_LOCATION;

      // Clean up existing map first
      if (map) {
        window.google.maps.event.clearInstanceListeners(map);
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        mapTypeId: 'roadmap',
        gestureHandling: 'cooperative',
      });

      const markerInstance = new window.google.maps.Marker({
        position: initialCenter,
        map: mapInstance,
        draggable: true,
        title: 'Event Location'
      });

      const updateStateFromCoords = (lat, lng) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFormData((prev) => ({
              ...prev,
              location: results[0].formatted_address,
              exact_map_location: {
                latitude: lat.toString(),
                longitude: lng.toString(),
                address: results[0].formatted_address,
              },
            }));
          }
        });
      };

      // Map click listener
      mapInstance.addListener("click", (e) => {
        markerInstance.setPosition(e.latLng);
        updateStateFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      // Marker drag listener
      markerInstance.addListener("dragend", (e) => {
        updateStateFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      // Autocomplete setup
      if (autocompleteRef.current) {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          { 
            fields: ["geometry", "name", "formatted_address"],
            types: ["establishment", "geocode"]
          }
        );

        autocompleteInstance.addListener("place_changed", () => {
          const place = autocompleteInstance.getPlace();
          if (!place.geometry?.location) return;
          
          const { lat, lng } = place.geometry.location;
          const newPosition = { lat: lat(), lng: lng() };
          
          setFormData((prev) => ({
            ...prev,
            location: place.formatted_address || "",
            venue: place.name || prev.venue,
            exact_map_location: {
              latitude: lat().toString(),
              longitude: lng().toString(),
              address: place.formatted_address || "",
            },
          }));
          
          mapInstance.setCenter(newPosition);
          mapInstance.setZoom(15);
          markerInstance.setPosition(newPosition);
        });
      }
      
      setMap(mapInstance);
      markerRef.current = markerInstance;
      
      // Ensure map renders properly with multiple resize triggers
      const triggerResize = () => {
        if (mapInstance && mapRef.current) {
          window.google.maps.event.trigger(mapInstance, 'resize');
          mapInstance.setCenter(initialCenter);
          mapInstance.setZoom(15);
        }
      };

      // Multiple resize attempts to ensure proper rendering
      setTimeout(triggerResize, 100);
      setTimeout(triggerResize, 300);
      setTimeout(triggerResize, 500);
    };
    
    initializeMap();
  }, [isApiReady, formData.location_type, dataLoaded]);
  useEffect(() => {
  const initializeComponent = async () => {
    setPageLoading(true);
    setDataLoaded(false); // Reset data loaded state
    
    if (!groupId) {
      navigate("/select-group");
      return;
    }

    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse)
        ? groupsResponse
        : groupsResponse.data || [];
      const groupData = groupsArray.find((g) => g._id === groupId);
      if (!groupData) {
        alert("Group not found.");
        navigate("/select-group");
        return;
      }
      setSelectedGroup(groupData);

      if (urlTicketId) {
        setIsEditMode(true);
        await loadExistingTicketData(urlTicketId);
      } else {
        if (location.state?.formData) {
          setFormData(location.state.formData);
          saveFormDataToStorage(location.state.formData);
        } else {
          const savedData = loadFormDataFromStorage();
          if (savedData) {
            setFormData(savedData);
          }
        }
      }
      
      // Set data loaded to true after all data operations are complete
      setDataLoaded(true);
      
    } catch (error) {
      console.error("Initialization error:", error);
      setDataLoaded(true); // Set to true even on error to allow map initialization
    } finally {
      setPageLoading(false);
    }
  };
  initializeComponent();
}, [groupId, urlTicketId, navigate, location.state]);
  // Update map position when coordinates change
  useEffect(() => {
    if (!map || !markerRef.current || formData.location_type !== 'offline') return;
    
    if (formData.exact_map_location.latitude && formData.exact_map_location.longitude) {
      const newPosition = {
        lat: parseFloat(formData.exact_map_location.latitude),
        lng: parseFloat(formData.exact_map_location.longitude),
      };
      
      // Use setTimeout to ensure the map container is visible
      setTimeout(() => {
        map.setCenter(newPosition);
        map.setZoom(15);
        markerRef.current.setPosition(newPosition);
        window.google.maps.event.trigger(map, 'resize');
      }, 50);
    }
  }, [formData.exact_map_location.latitude, formData.exact_map_location.longitude, map, formData.location_type]);

  // Add this effect to handle visibility changes
  useEffect(() => {
  if (map && formData.location_type === 'offline' && dataLoaded) {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      window.google.maps.event.trigger(map, 'resize');
      
      if (formData.exact_map_location.latitude && formData.exact_map_location.longitude) {
        const center = {
          lat: parseFloat(formData.exact_map_location.latitude),
          lng: parseFloat(formData.exact_map_location.longitude),
        };
        map.setCenter(center);
        map.setZoom(15);
        if (markerRef.current) {
          markerRef.current.setPosition(center);
        }
      }
    }, 100);
  }
}, [map, formData.location_type, dataLoaded]);
  useEffect(() => {
  if (!mapRef.current || !map) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && map) {
          setTimeout(() => {
            window.google.maps.event.trigger(map, 'resize');
            if (formData.exact_map_location.latitude && formData.exact_map_location.longitude) {
              const center = {
                lat: parseFloat(formData.exact_map_location.latitude),
                lng: parseFloat(formData.exact_map_location.longitude),
              };
              map.setCenter(center);
            }
          }, 100);
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(mapRef.current);

  return () => {
    if (mapRef.current) {
      observer.unobserve(mapRef.current);
    }
  };
}, [map, formData.exact_map_location]);

  useEffect(() => {
    if (formData.event_name || formData.location) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);

  // --- MODIFIED: handleInputChange to reset subcategory ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // If the category changes, reset the subcategory
      if (name === "event_category") {
        newData.event_subcategory = "";
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.groupId) {
      alert("Group ID is missing. Please select a group first.");
      navigate("/select-group");
      return;
    } 
    
    // --- MODIFIED: URL Validation to allow for missing "https://" ---
const youtubeRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/;
    if (
      formData.event_youtube_link &&
      !youtubeRegex.test(formData.event_youtube_link)
    ) {
      alert(
        "Invalid YouTube URL. Please use a valid format like 'youtube.com/watch?v=VIDEO_ID'"
      );
      return;
    }

    const instagramRegex = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?/;
    if (
      formData.event_instagram_link &&
      !instagramRegex.test(formData.event_instagram_link)
    ) {
      alert(
        "Invalid Instagram URL. Please enter a valid profile link, like 'instagram.com/username'"
      );
      return;
    }  
    // --- END OF MODIFICATION ---

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = formData.event_description || "";
    const descriptionText = (tempDiv.textContent || tempDiv.innerText).trim();
    const requiredFields = {
      event_name: formData.event_name?.trim(),
      event_category: formData.event_category?.trim(),
      event_subcategory: formData.event_subcategory?.trim(),
      event_type: formData.event_type?.trim(),
      event_language: formData.event_language?.trim(),
      location_type: formData.location_type?.trim(),
      event_dates: formData.event_dates,
      event_description: descriptionText,
      min_age_allowed: formData.min_age_allowed?.trim(),
    };
    const missingFields = Object.entries(requiredFields)
      .filter(
        ([_, value]) => !value || (Array.isArray(value) && value.length === 0)
      )
      .map(([key, _]) => key.replace(/_/g, " "));
    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields: ${missingFields.join(
          ", "
        )}`
      );
      return;
    }

    setLoading(true);
    try {
      const parseDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateValue;
        }
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0];
      };

      const transformedDates = formData.event_dates.map((d) => ({
        start_date: parseDate(d.date),
        end_date: parseDate(d.endDate),
        start_time: d.startTime,
        end_time: d.endTime,
      }));

      const eventDateTypeMap = {
        "Single day": "one-day",
        "Multi days": "multi-day",
        Weekly: "weekly",
      };

      const submitData = {
        ...formData,
        event_name: formData.event_name.trim(),
        event_category: formData.event_category.trim(),
        event_subcategory: formData.event_subcategory.trim(),
        event_type: formData.event_type.trim(),
        event_description: formData.event_description.trim(),
        userId: "user_12345", 
        location_type: formData.location_type.trim(),
        event_link: formData.event_link?.trim() || "",
        location: formData.location?.trim() || "",
        venue: formData.venue?.trim() || "",
        event_language: [formData.event_language.trim()],
        min_age_allowed: parseInt(formData.min_age_allowed.trim()),
        event_dates: transformedDates,
        event_date_type:
          eventDateTypeMap[formData.event_date_type] || "one-day",
        gate_open_time: formData.gatesOpenEarly
          ? formData.gate_open_time?.trim() || ""
          : "",
        exact_map_location:
          formData.exact_map_location?.latitude &&
          formData.exact_map_location?.longitude
            ? {
                latitude: parseFloat(formData.exact_map_location.latitude),
                longitude: parseFloat(formData.exact_map_location.longitude),
                address: formData.exact_map_location.address,
              }
            : undefined,
      };

      const response = await createTicketBasicInfo(submitData);
      const newTicketId = response.ticketId || response.data?.ticketId || response.data?._id;
      const groupId = formData.groupId;
      console.log(
        "Navigating with groupId:",
        groupId,
        "and ticketId:",
        newTicketId
      );

      navigate(`/ticket/update-ticket-media/${newTicketId}`, {
        state: {
          message: `${isEditMode ? "Event updated" : "Event created"} successfully!`,
          newEvent: response.data,
          ticketId: newTicketId,
          formData: formData,
        },
      });
    } catch (error) {
      console.error("Error creating event:", error);
      alert(
        error.response?.data?.message ||
          "Error creating event. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    clearFormDataFromStorage();
    navigate("/select-group");
  };
  const handleLocationInputChange = (e) => handleInputChange(e);
  const handleToggleChange = (name) =>
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  const handleTagChange = (name, newTags) =>
    setFormData((prev) => ({ ...prev, [name]: newTags }));
      const handleSelectChange = (selectedOption, { name }) => {
        const value = selectedOption ? selectedOption.value : "";
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };
            if (name === "event_category") {
                newData.event_subcategory = "";
            }
            return newData;
        });
    };
  const handleLocationTypeChange = (type) =>
    setFormData((prev) => ({ ...prev, location_type: type.toLowerCase() }));
  const handleDatesSave = (newDates, dateType) =>
    setFormData((prev) => ({
      ...prev,
      event_dates: newDates,
      event_date_type: dateType,
    }));
  const removeDate = (dateToRemove) =>
    setFormData((prev) => ({
      ...prev,
      event_dates: prev.event_dates.filter((d) => d.date !== dateToRemove),
    }));
  const handleGuestsSave = (newGuests) =>
    setFormData((prev) => ({ ...prev, guests: newGuests }));
  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setIsGuestModalOpen(true);
  };
  const handleProhibitedItemsSave = (newItems) =>
    setFormData((prev) => ({ ...prev, prohibited_items: newItems }));
  const removeProhibitedItem = (itemToRemove) =>
    setFormData((prev) => ({
      ...prev,
      prohibited_items: prev.prohibited_items.filter(
        (item) => item !== itemToRemove
      ),
    }));
  const handlePocChange = (e) =>
    setPoc({ ...poc, [e.target.name]: e.target.value });
  
    const handleAddPoc = () => {
      // Trim input values once for consistency
      const trimmedName = poc.POC_name.trim();
      const trimmedEmail = poc.POC_email.trim();
      const trimmedContact = poc.POC_contact.trim();
  
      // 1. Check for empty fields first
      if (!trimmedName || !trimmedEmail || !trimmedContact) {
        alert("Please fill in all Point of Contact fields: Name, Email, and Contact Number.");
        return;
      }
  
      // 2. Check for duplicate email
      const isDuplicateEmail = formData.POCS.some(p => p.POC_email === trimmedEmail);
      if (isDuplicateEmail) {
        alert("This email address is already in use by another POC. Please use a different email.");
        return;
      }
  
      // 3. Check for duplicate contact number
      const isDuplicateContact = formData.POCS.some(p => p.POC_contact === trimmedContact);
      if (isDuplicateContact) {
        alert("This contact number is already in use by another POC. Please use a different number.");
        return;
      }
  
      // If all checks pass, add the new POC
      const newPoc = {
        POC_name: trimmedName,
        POC_email: trimmedEmail,
        POC_contact: trimmedContact,
      };
      setFormData((prev) => ({ ...prev, POCS: [...prev.POCS, newPoc] }));
      setPoc({ POC_name: "", POC_email: "", POC_contact: "" }); // Reset form
    };

  const handleRemovePoc = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      POCS: prev.POCS.filter((_, index) => index !== indexToRemove),
    }));
  };
  const handleFormat = (command) => document.execCommand(command, false, null);
  const handleFileChange = (e) => {
    if (e.target.files[0])
      setFormData((prev) => ({ ...prev, event_rules_file: e.target.files[0] }));
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event information...</p>
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Group Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The selected group could not be found or you don't have access to
            it.
          </p>
          <button
            onClick={() => navigate("/select-group")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Select a Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CustomScrollbarStyles isDark={darkMode} />
      <DatePickerModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onSave={handleDatesSave}
        initialDates={formData.event_dates}
        darkMode={darkMode}
      />
      <GuestModal
        isOpen={isGuestModalOpen}
        onClose={() => {
          setIsGuestModalOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleGuestsSave}
        initialGuests={formData.guests}
        editingGuest={editingGuest}
        darkMode={darkMode}
      />
      <ProhibitedItemsModal
        isOpen={isProhibitedModalOpen}
        onClose={() => setIsProhibitedModalOpen(false)}
        onSave={handleProhibitedItemsSave}
        initialItems={formData.prohibited_items}
        darkMode={darkMode}
      />
      <div className={`${darkMode ? "dark" : ""}`}>
        <div className="bg-white dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
          <EventSidebar
  darkMode={darkMode}         // dark theme boolean from your app state
  currentStep={2}     // current step index (1-based)
  isAddShowFlow={false} // true if Add Show path, else Banking & Tickets
/>

          <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto main-scrollbar">
            <div className="absolute top-6 right-6 z-10">
              <ThemeToggle
                isDark={darkMode}
                onToggle={() => setDarkMode(!darkMode)}
              />
            </div>
            <div className="w-full max-w-5xl mx-auto">
              <div className="text-center mt-4 mb-12">
                <div
                  className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 border ${
                    darkMode
                      ? "bg-[#2B2B2B] border-gray-700"
                      : "bg-gray-100 border-gray-200"
                  }`}
                >
                  <svg
                    className="w-10 h-10 text-indigo-500 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.975 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    ></path>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {isEditMode
                    ? "Edit Your Event"
                    : "Name it. Classify it. Describe it. Your event begins here."}
                </h1>
                {selectedGroup && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {isEditMode
                      ? "Updating event under:"
                      : "Creating event under:"}{" "}
                    <span className="font-semibold text-indigo-600">
                      {selectedGroup.name || selectedGroup.group_name}
                    </span>
                  </p>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Event Details */}
                <div className="space-y-8">
                  <div>
                    <label
                      htmlFor="event_name"
                      className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                    >
                      Event name<span className="text-red-400">*</span>
                      <InfoTooltip note="The public title of your event." />
                    </label>
                    <input
                      id="event_name"
                      name="event_name"
                      type="text"
                      value={formData.event_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your event name here..."
                      className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_category"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        Event category<span className="text-red-400">*</span>
                        <InfoTooltip note="Helps attendees find your event." />
                      </label>
                                        <div className="relative">
                                            <Select
                                                name="event_category"
                                                options={categoryOptions}
                                                value={categoryOptions.find(option => option.value === formData.event_category)}
                                                onChange={handleSelectChange}
                                                placeholder="Select category"
                                                styles={customSelectStyles(darkMode)}
                                                required
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                    </div>
                    <div>
                      <label
                        htmlFor="event_subcategory"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        Event subcategory
                        <span className="text-red-400">*</span>
                        <InfoTooltip note="Get more specific with your category." />
                      </label>
                      {/* --- MODIFIED: Event Subcategory Dropdown --- */}
                                            <Select
                                                name="event_subcategory"
                                                options={subCategoryOptions}
                                                value={subCategoryOptions.find(option => option.value === formData.event_subcategory)}
                                                onChange={handleSelectChange}
                                                placeholder="Select subcategory"
                                                styles={customSelectStyles(darkMode)}
                                                isDisabled={!formData.event_category}
                                                required
                                            />   
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Event type<span className="text-red-400">*</span>
                      <InfoTooltip note="Public events are visible to everyone." />
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                        <input
                          type="radio"
                          name="event_type"
                          value="public"
                          checked={formData.event_type === "public"}
                          onChange={handleInputChange}
                          className="hidden peer"
                        />
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></span>
                        </span>
                        <span className="ml-2">Public</span>
                      </label>
                      <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300">
                        <input
                          type="radio"
                          name="event_type"
                          value="private"
                          checked={formData.event_type === "private"}
                          onChange={handleInputChange}
                          className="hidden peer"
                        />
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300"></span>
                        </span>
                        <span className="ml-2">Private</span>
                      </label>
                    </div>
                  </div>
                </div>
                {/* Location Section */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Location
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Choose where your event will take place
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Event location type<span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      {["Offline", "Online", "Recorded"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleLocationTypeChange(type)}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                            formData.location_type === type.toLowerCase()
                              ? "bg-[#10B981] text-white shadow-lg"
                              : "bg-gray-200 dark:bg-[#374151] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.location_type === "offline" && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label
                            htmlFor="location"
                            className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                          >
                            Event location
                            <span className="text-red-400">*</span>
                            <InfoTooltip note="Start typing to search with Google Places." />
                          </label>
                          <input
                            ref={autocompleteRef}
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleLocationInputChange}
                            placeholder="Search for location..."
                            className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="venue"
                            className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                          >
                            Event venue<span className="text-red-400">*</span>
                            <InfoTooltip note="e.g., Main Auditorium, Hall B1" />
                          </label>
                          <input
                            id="venue"
                            name="venue"
                            type="text"
                            value={formData.venue}
                            onChange={handleInputChange}
                            placeholder="Enter the event venue"
                            className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Exact map location
                          <span className="text-red-400">*</span>
                          <InfoTooltip note="Click on the map to set exact location. Drag the marker to adjust." />
                        </label>
                        <div
                          ref={mapRef}
                          className="w-full h-64 rounded-lg border bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-[#4A4A4A]"
                          style={{ 
                            minHeight: "300px", 
                            display: formData.location_type === 'offline' ? 'block' : 'none',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        ></div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Click anywhere on the map or drag the marker to set
                          the exact location
                        </div>
                      </div>
                      {formData.exact_map_location.latitude &&
                        formData.exact_map_location.longitude && (
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Selected Location:</strong>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Lat: {formData.exact_map_location.latitude}, Lng:{" "}
                              {formData.exact_map_location.longitude}
                            </div>
                            {formData.exact_map_location.address && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Address: {formData.exact_map_location.address}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                  {(formData.location_type === "online" ||
                    formData.location_type === "recorded") && (
                    <div className="space-y-4 animate-fade-in">
                      <label
                        htmlFor="event_link"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        Event Link <span className="text-red-400">*</span>
                        <InfoTooltip note="The URL where the online/recorded event can be accessed." />
                      </label>
                      <input
                        id="event_link"
                        name="event_link"
                        type="text"
                        value={formData.event_link}
                        onChange={handleInputChange}
                        required
                        placeholder="https://zoom.us/j/..."
                        className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  )}
                </div>
                {/* Additional Fields */}
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_language"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        Which language will your event be performed in?
                        <span className="text-red-400">*</span>{" "}
                        <InfoTooltip note="Select the primary language." />
                      </label>
                      <div className="relative">
                        {/* --- MODIFIED: Event Language Dropdown --- */}
                                                                <Select
                                            name="event_language"
                                            options={languageOptions}
                                            value={languageOptions.find(option => option.value === formData.event_language)}
                                            onChange={handleSelectChange}
                                            placeholder="Select language"
                                            styles={customSelectStyles(darkMode)}
                                            required
                                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="min_age_allowed"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        What is the minimum age allowed for entry?
                        <span className="text-red-400">*</span>{" "}
                        <InfoTooltip note="Select an age limit if applicable." />
                      </label>
                      <div className="relative">
                            <Select
        name="min_age_allowed"
        options={ageOptions}
        value={ageOptions.find(option => option.value === formData.min_age_allowed)}
        onChange={handleSelectChange}
        placeholder="Select minimum age"
        styles={customSelectStyles(darkMode)}
        
        required
    />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  {formData.location_type === "offline" && (
                    <div className="animate-fade-in">
                      <label
                        htmlFor="seating_arrangement"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        Will your audience be seated or standing?
                        <span className="text-red-400">*</span>{" "}
                        <InfoTooltip note="Specify the audience arrangement." />
                      </label>
                      <div className="relative">
    <Select
        name="seating_arrangement"
        options={seatingOptions}
        value={seatingOptions.find(option => option.value === formData.seating_arrangement)}
        onChange={handleSelectChange}
        placeholder="Select a type"
        styles={customSelectStyles(darkMode)}
        
        required={formData.location_type === 'offline'}
    />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4 pt-4">
                    <ToggleSwitch
                      label="Is this event kid friendly?"
                      checked={formData.kids_friendly}
                      onChange={() => handleToggleChange("kids_friendly")}
                      darkMode={darkMode}
                    />
                    <ToggleSwitch
                      label="Is this event pet friendly?"
                      checked={formData.pet_friendly}
                      onChange={() => handleToggleChange("pet_friendly")}
                      darkMode={darkMode}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="event_instagram_link"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        Instagram link (Optional){" "}
                        <InfoTooltip note="Link to your event's Instagram page." />
                      </label>
                      <input
                        id="event_instagram_link"
                        name="event_instagram_link"
                        type="text"
                        value={formData.event_instagram_link}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/..."
                        className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="event_youtube_link"
                        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                      >
                        Youtube link (Optional){" "}
                        <InfoTooltip note="Link to a YouTube video or channel." />
                      </label>
                      <input
                        id="event_youtube_link"
                        name="event_youtube_link"
                        type="text  "
                        value={formData.event_youtube_link}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/..."
                        className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div>
                    <TagInput
                      label="Event hashtags (Optional)"
                      tags={formData.hashtag}
                      onTagsChange={(newTags) =>
                        handleTagChange("hashtag", newTags)
                      }
                      placeholder="Eg. #Concert"
                      darkMode={darkMode}
                    />
                  </div>
                </div>
                {/* --- DATES AND TIMES --- */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Dates and times
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose when your event will take place
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsDateModalOpen(true)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                      Add dates and time{" "}
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  {formData.event_dates.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Dates you selected
                      </label>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {formData.event_dates.map((item) => (
                          <div
                            key={item.date}
                            className="bg-gray-100 dark:bg-[#2B2B2B] rounded-lg p-3 text-center text-sm font-semibold relative"
                          >
                            {new Date(
                              item.date + "T00:00:00"
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            <button
                              onClick={() => removeDate(item.date)}
                              type="button"
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.location_type === "offline" && (
                          <div className="animate-fade-in">
                            <div className="flex items-center justify-between pt-4">
                              <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                Does the gates open before event starting time?
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={formData.gatesOpenEarly}
                                  onChange={() => handleToggleChange("gatesOpenEarly")}
                                />
                                <div
                                  className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                    darkMode
                                      ? "bg-gray-600 after:border-gray-500 peer-checked:bg-indigo-600"
                                      : "bg-gray-200 after:border-gray-300 peer-checked:bg-indigo-500"
                                  }`}
                                ></div>
                              </label>
                            </div>

                            {formData.gatesOpenEarly && (
                              <div>
                                <label
                                  htmlFor="gate_open_time"
                                  className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
                                >
                                  Time of gate opening?
                                  <span className="text-red-400">*</span>{" "}
                                  <InfoTooltip note="Set the time when gates will open." />
                                </label>

                                {/* Custom 12-hour time picker with placeholders */}
                                <div className="flex gap-2">
                                  {/* Hour */}
                                  <select
                                    id="gate_open_hour"
                                    name="gate_open_hour"
                                    value={formData.gate_open_hour || ""}
                                    onChange={handleInputChange}
                                    className={`w-1/3 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300
                                      ${darkMode ? "bg-[#1E1E1E] text-white border-[#4A4A4A]" : "bg-white text-black border-gray-300"}`}
                                  >
                                    <option value="" disabled>Hour</option>
                                    {[...Array(12)].map((_, i) => {
                                      const hour = i + 1;
                                      return (
                                        <option key={hour} value={hour}>
                                          {hour}
                                        </option>
                                      );
                                    })}
                                  </select>

                                  {/* Minute */}
                                  <select
                                    id="gate_open_minute"
                                    name="gate_open_minute"
                                    value={formData.gate_open_minute || ""}
                                    onChange={handleInputChange}
                                    className={`w-1/3 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300
                                      ${darkMode ? "bg-[#1E1E1E] text-white border-[#4A4A4A]" : "bg-white text-black border-gray-300"}`}
                                  >
                                    <option value="" disabled>Minute</option>
                                    {[...Array(60)].map((_, i) => {
                                      const minute = i.toString().padStart(2, "0");
                                      return (
                                        <option key={minute} value={minute}>
                                          {minute}
                                        </option>
                                      );
                                    })}
                                  </select>

                                  {/* AM/PM */}
                                  <select
                                    id="gate_open_ampm"
                                    name="gate_open_ampm"
                                    value={formData.gate_open_ampm || ""}
                                    onChange={handleInputChange}
                                    className={`w-1/3 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300
                                      ${darkMode ? "bg-[#1E1E1E] text-white border-[#4A4A4A]" : "bg-white text-black border-gray-300"}`}
                                  >
                                    <option value="" disabled>AM/PM</option>
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                </div>
                {/* --- GUESTS, RULES, ETC. --- */}
                <div className="space-y-12">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Guest/Guide/Artists details
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Enter details of the person guiding or managing the event.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestModalOpen(true);
                        setEditingGuest(null);
                      }}
                      className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white flex items-center gap-2"
                    >
                      Add guest/guides{" "}
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        ></path>
                      </svg>
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {formData.guests.map((guest) => (
                        <div
                          key={guest.id}
                          className={`rounded-lg p-3 flex items-center justify-between ${
                            darkMode ? "bg-[#2B2B2B]" : "bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={guest.image}
                              alt={guest.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="font-semibold">{guest.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditGuest(guest)}
                            className={`p-2 ${
                              darkMode
                                ? "text-gray-400 hover:text-white"
                                : "text-gray-500 hover:text-black"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Event rules and regulations
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Describe your event rules and regulations
                      </p>
                    </div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Rules and regulations (Optional)
                    </label>
                    <div
                      className={`bg-transparent border rounded-lg ${
                        darkMode ? "border-[#4A4A4A]" : "border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-2 border-b ${
                          darkMode ? "border-[#4A4A4A]" : "border-gray-300"
                        } flex items-center space-x-1`}
                      >
                        <button
                          type="button"
                          onClick={() => handleFormat("bold")}
                          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("italic")}
                          className={`w-8 h-8 flex items-center justify-center rounded italic ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("underline")}
                          className={`w-8 h-8 flex items-center justify-center rounded underline ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          U
                        </button>
                      </div>
                      <div
                        ref={rulesEditorRef}
                        contentEditable="true"
                        onInput={() => {
                          if (rulesEditorRef.current) {
                            setFormData((prev) => ({
                              ...prev,
                              event_rules: {
                                ...(prev.event_rules || { type: "text" }),
                                content: rulesEditorRef.current.innerHTML,
                              },
                            }));
                          }
                        }}
                        className="w-full min-h-[120px] p-3 focus:outline-none resize-none text-left [direction:ltr]"
                      ></div>
                    </div>
                    <p className="px-4">  or</p>
                    <div>
                      <label
                        htmlFor="rule-file-upload"
                        className={`px-4 py-2 border rounded-lg font-semibold flex items-center gap-2 cursor-pointer w-max ${
                          darkMode
                            ? "border-gray-600 hover:bg-gray-700"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        Attach document{" "}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          ></path>
                        </svg>
                      </label>
                      <input
                        id="rule-file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {formData.event_rules_file && (
                        <span
                          className={`ml-4 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {formData.event_rules_file.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Prohibited items
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Add the things that are not allowed for this event
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsProhibitedModalOpen(true)}
                      className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                      Add Prohibited Items
                    </button>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {formData.prohibited_items.map((item) => (
                        <div
                          key={item}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            darkMode
                              ? "bg-[#2B2B2B] text-gray-300"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => removeProhibitedItem(item)}
                            className={`${
                              darkMode
                                ? "text-gray-500 hover:text-white"
                                : "text-gray-400 hover:text-black"
                            }`}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Event description <span className="text-red-400">*</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Describe your event how it is
                    </p>
                    <div
                      className={`mt-4 bg-transparent border rounded-lg ${
                        darkMode ? "border-[#4A4A4A]" : "border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-2 border-b ${
                          darkMode ? "border-[#4A4A4A]" : "border-gray-300"
                        } flex items-center space-x-1`}
                      >
                        <button
                          type="button"
                          onClick={() => handleFormat("bold")}
                          className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("italic")}
                          className={`w-8 h-8 flex items-center justify-center rounded italic ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormat("underline")}
                          className={`w-8 h-8 flex items-center justify-center rounded underline ${
                            darkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          U
                        </button>
                      </div>
                      <div
                        ref={descriptionEditorRef}
                        contentEditable="true"
                        onInput={() => {
                          if (descriptionEditorRef.current) {
                            handleInputChange({
                              target: {
                                name: "event_description",
                                value: descriptionEditorRef.current.innerHTML,
                              },
                            });
                          }
                        }}
                        className="w-full min-h-[120px] p-3 focus:outline-none text-left [direction:ltr]"
                      ></div>
                    </div>
                  </div>
                  {/* Point of Contact Section */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Point of Contact
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Please add POCs with whom event feedback will be shared
                    </p>

                    {/* POC Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Name<span className="text-red-400">*</span>{" "}
                          <InfoTooltip note="Full name of the contact person." />
                        </label>
                        <input
                          name="POC_name"
                          value={poc.POC_name}
                          onChange={handlePocChange}
                          placeholder="enter the name of person"
                          className={`w-full px-4 py-3 bg-transparent border rounded-lg ${
                            darkMode
                              ? "text-white border-[#4A4A4A]"
                              : "text-black border-gray-300"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Email<span className="text-red-400">*</span>{" "}
                          <InfoTooltip note="Contact person's email address." />
                        </label>
                        <input
                          name="POC_email"
                          value={poc.POC_email}
                          onChange={handlePocChange}
                          type="email"
                          placeholder="enter the email id"
                          className={`w-full px-4 py-3 bg-transparent border rounded-lg ${
                            darkMode
                              ? "text-white border-[#4A4A4A]"
                              : "text-black border-gray-300"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="mt-8">
                      <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Contact number<span className="text-red-400">*</span>{" "}
                        <InfoTooltip note="Contact person's phone number." />
                      </label>
                      <input
                        name="POC_contact"
                        value={poc.POC_contact}
                        onChange={handlePocChange}
                        type="tel"
                        placeholder="enter contact number"
                        className={`w-full px-4 py-3 bg-transparent border rounded-lg ${
                          darkMode
                            ? "text-white border-[#4A4A4A]"
                            : "text-black border-gray-300"
                        }`}
                      />
                    </div>

                    {/* Add POC Button */}
                    <button
                      type="button"
                      onClick={handleAddPoc}
                      className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold"
                    >
                      Add +
                    </button>

                    {/* UPDATED: Display List of Added POCs in a Grid */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formData.POCS.map((pocItem, index) => (
                        <div
                          key={index}
                          className="rounded-lg p-3 flex items-center justify-between bg-gray-100 dark:bg-[#2B2B2B]"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Placeholder Avatar */}

                            {/* Name and Email */}
                            <div className="truncate">
                              <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                                {pocItem.POC_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {pocItem.POC_email} | {pocItem.POC_contact}
                              </p>
                            </div>
                          </div>
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemovePoc(index)}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                            aria-label="Remove Point of Contact"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-8 flex justify-end gap-4">
                  <button
                    type="button"
                    className={`px-8 py-3 rounded-lg font-semibold ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                    onClick={handleBack}
                  >
                    Go back
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save and continue"}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
export default CreateTicket;
