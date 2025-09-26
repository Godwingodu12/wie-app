import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateTicketAddOns, getTicketById, getGroupView } from '../../services/ticketService';
import { format } from "date-fns";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
const InfoTooltip = ({ note }) => (
    <div className="relative flex items-center group ml-1.5">
        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
        </svg>
        <div className="absolute left-full ml-2 w-max max-w-xs p-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
            {note}
        </div>
    </div>
);
const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
        <div className="w-11 h-6 bg-gray-200 dark:bg-[#363A3F] rounded-full peer peer-checked:bg-indigo-600 shadow-inner-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
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
            <label className={`flex items-center text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"} mb-2`}>
                {label} <InfoTooltip note="Press Enter to add a tag." />
            </label>
            <div className={`flex flex-wrap items-center gap-2 p-2 bg-transparent border rounded-lg ${darkMode ? "border-[#4A4A4A]" : "border-gray-300"}`}>
    {Array.isArray(tags) && tags.map((tag, index) => (
        <div key={index} className="flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
            <span>{tag}</span>
            <button type="button" onClick={() => removeTag(tag)} className="text-indigo-400 dark:text-indigo-300 hover:text-indigo-600 dark:hover:text-white font-bold">
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
        className={`flex-1 bg-transparent focus:outline-none p-1 ${darkMode ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`} 
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
  const [isEditingSubEvent, setIsEditingSubEvent] = useState(false);
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
    const convertTo12Hour = (time24h) => {
        if (!time24h) return { time: '', ampm: '' };
        const [hours, minutes] = time24h.split(':');
        let hour12 = parseInt(hours);
        const ampm = hour12 >= 12 ? 'PM' : 'AM';
        if (hour12 === 0) hour12 = 12;
        else if (hour12 > 12) hour12 -= 12;
        return {
            time: `${hour12.toString().padStart(2, '0')}:${minutes}`,
            ampm: ampm
        };
    };
    const resetForm = () => {
        setFormData(initialFormState);
        setPreviews({ ticket_layout: null, event_banner: null, event_logo: null });
        setEditingSubEventId(null);
        setIsEditingSubEvent(false);
        setHasSeatingLayout(false); // Reset seating layout toggle
        if (rulesEditorRef.current) rulesEditorRef.current.innerHTML = '';
        if (descriptionEditorRef.current) descriptionEditorRef.current.innerHTML = '';
    };
    {isEditingSubEvent && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-blue-800 dark:text-blue-200 font-medium">
                        Editing Sub-Event: {formData.event_name || 'Untitled Event'}
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                        Make your changes below and click "Save and continue" or "Add more sub events"
                    </p>
                    <p className="text-blue-500 dark:text-blue-400 text-xs mt-1">
                        Note: You'll need to re-upload media files (banner, logo, images) as they can't be restored from the database.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    Cancel Edit
                </button>
            </div>
        </div>
    )}

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
                  if (!item?.date) {
                    return null; 
                  }
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
    "Umbrellas", "Wooden sticks", "Power bank", "Helmets", "Glass containers",
    "Laptops", "Laser pointer/Flashlight", "Outside food", "Alcohol",
    "Music instrument", "Toxics", "Chemicals", "Camera", "Selfie sticks",
    "Metal containers", "Bags", "Flammable", "Banners", "Cans", "Tins", "Bottles",
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
const CreateTicketModal = ({ isOpen, onClose, onSave, editingTicket, existingTickets }) => {
    const [localTickets, setLocalTickets] = useState([]);
    const [ticketType, setTicketType] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [totalTickets, setTotalTickets] = useState('');
    const [ticketPhoto, setTicketPhoto] = useState(null);
    const [ticketPhotoPreview, setTicketPhotoPreview] = useState('');
    const [currentEditId, setCurrentEditId] = useState(null);
    useEffect(() => {
        if (isOpen) {
            setLocalTickets(existingTickets || []);
            if (editingTicket) {
                setTicketType(editingTicket.name);
                setTicketPrice(editingTicket.price);
                setTotalTickets(editingTicket.capacity);
                setTicketPhotoPreview(editingTicket.image);
                setTicketPhoto(editingTicket.photoFile || null);
                setCurrentEditId(editingTicket.id);
            } else {
                setCurrentEditId(null); 
                setTicketType(''); 
                setTicketPrice(''); 
                setTotalTickets(''); 
                setTicketPhoto(null); 
                setTicketPhotoPreview('');
            }
        }
    }, [editingTicket, existingTickets, isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setTicketPhoto(file);
            setTicketPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleAddOrUpdateTicket = () => {
        if (!ticketType || !ticketPrice || !totalTickets) {
            alert("Please fill in all ticket details: Type, Price, and Total Tickets.");
            return;
        }

        const ticketData = { 
            name: ticketType, 
            price: ticketPrice, 
            capacity: totalTickets, 
            image: ticketPhotoPreview || `https://i.pravatar.cc/150?u=${Date.now()}`, 
            photoFile: ticketPhoto 
        };

        if (currentEditId) {
            const updatedList = localTickets.map(t => t.id === currentEditId ? { ...ticketData, id: currentEditId } : t);
            setLocalTickets(updatedList);
        } else {
            setLocalTickets([...localTickets, { ...ticketData, id: Date.now() }]);
        }
        
        setCurrentEditId(null);
        setTicketType(''); 
        setTicketPrice(''); 
        setTotalTickets(''); 
        setTicketPhoto(null); 
        setTicketPhotoPreview('');
    };

    const handleDeleteTicket = (ticketIdToDelete) => setLocalTickets(localTickets.filter(t => t.id !== ticketIdToDelete));
    const startEditing = (ticket) => { 
        setCurrentEditId(ticket.id); 
        setTicketType(ticket.name); 
        setTicketPrice(ticket.price); 
        setTotalTickets(ticket.capacity); 
        setTicketPhotoPreview(ticket.image); 
        setTicketPhoto(ticket.photoFile || null); 
    };
    
    const handleSave = () => { 
        onSave(localTickets); 
        onClose(); 
    };

    const handleResetAll = () => {
        setLocalTickets([]);
        setCurrentEditId(null);
        setTicketType('');
        setTicketPrice('');
        setTotalTickets('');
        setTicketPhoto(null);
        setTicketPhotoPreview('');
    };

    if (!isOpen) return null;

    return (
       <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#2B2B2B] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentEditId ? "Edit Ticket" : "Create Ticket"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 text-3xl hover:text-gray-800 dark:hover:text-white transition"
            >
              &times;
            </button>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex gap-6">
              {/* Left Side */}
              <div className="w-1/2 space-y-5 flex flex-col">
                <input
                  type="text"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  placeholder="e.g. VIP, General Admission"
                  className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Ticket price
                  </label>
                  <div className="flex items-center bg-gray-100 dark:bg-[#1c1c1f] border border-gray-300 dark:border-gray-700 rounded-md">
                    <span className="text-gray-500 dark:text-gray-400 pl-3">INR</span>
                    <input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      placeholder="Ticket price"
                      className="w-full bg-transparent p-3 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total tickets
                  </label>
                  <input
                    type="number"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    placeholder="Total tickets available"
                    className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3"
                  />
                </div>

                <div className="flex-grow flex flex-col">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Upload ticket photo
                  </label>
                  <div className="flex-grow mt-2 flex justify-center items-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center">
                    <label htmlFor="ticket-photo-upload" className="cursor-pointer">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        browse your files
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Max 10 MB files are allowed
                      </p>
                      <span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">
                        Browse file
                      </span>
                      <input
                        id="ticket-photo-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex-shrink-0">
                  <button
                    onClick={handleAddOrUpdateTicket}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition w-full"
                  >
                    {currentEditId ? "Update Ticket" : "+ Add Ticket"}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

              {/* Right Side */}
              <div className="w-1/2 space-y-3">
                {localTickets.length === 0 ? (
                  <div className="text-center text-gray-500 pt-16">
                    No tickets added yet.
                  </div>
                ) : (
                  localTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-gray-100 dark:bg-[#363A3F] p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={ticket.image}
                          alt={ticket.name}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {`${ticket.name} - ₹${Number(ticket.price).toLocaleString()}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Capacity: {ticket.capacity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditing(ticket)}
                          className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Footer */}
          <div className="p-6 flex justify-end gap-4 flex-shrink-0">
            <button
              onClick={handleResetAll}
              className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Reset all
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
};

const FileInput = ({ id, label, info, preview, onFileChange, onRemove, darkMode }) => (
    <div>
        <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{label}{info && <InfoTooltip note={info} />}</label>
        <div className={`relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[180px] flex justify-center items-center border-2 border-dashed ${preview ? "border-indigo-500" : "border-gray-300 dark:border-gray-600"}`}>
            {preview ? (
                <>
                    <img src={preview} alt={`${label} preview`} className="max-w-full max-h-[160px] object-contain rounded-lg"/>
                    <button type="button" onClick={() => onRemove(id)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center">&times;</button>
                </>
            ) : (
                <label htmlFor={id} className="cursor-pointer flex flex-col items-center gap-2">
                       <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                       <span className="text-indigo-500 dark:text-indigo-400 font-semibold">Click to browse</span>
                </label>
            )}
            <input id={id} type="file" className="sr-only" onChange={(e) => onFileChange(e, id)} accept="image/*" />
        </div>
    </div>
);


// --- Main Component ---
const UpdateTicketAddOns = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [existingSubEvents, setExistingSubEvents] = useState([]);
    const [groupBankDetails, setGroupBankDetails] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isApiReady, setIsApiReady] = useState(false);
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const autocompleteRef = useRef(null);
    const markerRef = useRef(null);
    const storageKey = `ticketFormData_${ticketId || "new"}`;
    const [editingSubEventId, setEditingSubEventId] = useState(null);
    const [isEditingSubEvent, setIsEditingSubEvent] = useState(false);
    const [subEventLoading, setSubEventLoading] = useState(false);
    // Modal states
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [isProhibitedModalOpen, setIsProhibitedModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);

    // --- State for Banking Details ---
    const [useGroupBankAccount, setUseGroupBankAccount] = useState(false);
    const [groupHasBankAccount, setGroupHasBankAccount] = useState(false);
    const [groupBankDetailsIncomplete, setGroupBankDetailsIncomplete] = useState(false);

    // --- State for Seating Details ---
    const [hasSeatingLayout, setHasSeatingLayout] = useState(false);
    
    // --- State for multi-media preview ---
    const [showExtraMedia, setShowExtraMedia] = useState(false);
    const [poc, setPoc] = useState({ POC_name: '', POC_email: '', POC_contact: '' });
    const rulesEditorRef = useRef(null);
    const descriptionEditorRef = useRef(null);
    const INITIAL_MAP_LOCATION = {
      lat: 10.5276,
      lng: 76.2144,
      address: "Thrissur, Kerala, India"
    };
    const handleLocationInputChange = (e) => {
      // Just update the form data, don't geocode on every keystroke
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };


const initialFormState = {
        event_name: '',
        event_category: '',
        event_subcategory: '',
        event_type: 'public',
        location_type: 'offline',
        event_link: '',
        location: '',
        venue: '',
        event_language: '',
        min_age_allowed: '',
        seating_arrangement: '',
        kids_friendly: false,
        pet_friendly: false,
        gate_open_time: false,
        event_instagram_link: '',
        event_youtube_link: '',
        hashtag: [],
        event_dates: [],
        event_date_type: "",
        gate_open_time: "",
        guests: [], 
        event_rules_file: null,
        prohibited_items: [],
        POCS: [],
        payment_type: 'free',
        banking_details: [{ 
            bank_acc_type: '', 
            bank_acc_holder: '', 
            bank_acc_no: '', 
            bank_ifsc: '' 
        }],
        booking_start_date: '',
        booking_end_date: '',
        ticket_types: [],
        total_capacity: '',
        ticket_layout: null, 
        event_banner: null,
        event_logo: null,
        event_images: [],
        exact_map_location: { 
        latitude: INITIAL_MAP_LOCATION.lat.toString(), 
        longitude: INITIAL_MAP_LOCATION.lng.toString(), 
        address: INITIAL_MAP_LOCATION.address 
      },
    };
    const [formData, setFormData] = useState(initialFormState);
    const [previews, setPreviews] = useState({
        ticket_layout: null,
        event_banner: null,
        event_logo: null,
    });
const fetchData = async () => {
    if (!ticketId) {
        console.error('No ticketId available');
        setPageLoading(false);
        return;
    }

    console.log('Starting fetchData with ticketId:', ticketId);
    setPageLoading(true);
    
    try {
        // Fetch ticket data first
        console.log('Fetching ticket data...');
        const ticketData = await getTicketById(ticketId);
        console.log('Ticket data response:', ticketData);
        setExistingSubEvents(ticketData?.ticket?.sub_events || []);

        // Enhanced group data fetching with better error handling
        console.log('Fetching group data...');
        try {
            // Add validation to ensure ticketId is properly formatted
            const cleanTicketId = ticketId.toString().trim();
            console.log('Clean ticketId being sent:', cleanTicketId);
            
            // Call the API with proper error handling
            const groupResponse = await getGroupView(cleanTicketId);
            console.log('Raw group response:', groupResponse);
            
            // Check if we got a valid response
            if (!groupResponse) {
                console.warn('Empty response from getGroupView API');
                setGroupDefaults();
                return;
            }

            // Log the response structure to understand what we're getting
            console.log('Group response structure:', {
                type: typeof groupResponse,
                keys: Object.keys(groupResponse || {}),
                hasData: Boolean(groupResponse.data),
                hasGroup: Boolean(groupResponse.group),
                directBankingDetails: Boolean(groupResponse.banking_details)
            });

            // Try to extract group data from various possible response structures
            let groupData = null;
            
            // Common response patterns from different APIs
            if (groupResponse.data && groupResponse.data.group) {
                groupData = groupResponse.data.group;
                console.log('Found group data in response.data.group');
            } else if (groupResponse.group) {
                groupData = groupResponse.group;
                console.log('Found group data in response.group');
            } else if (groupResponse.data) {
                groupData = groupResponse.data;
                console.log('Using response.data as group data');
            } else {
                groupData = groupResponse;
                console.log('Using entire response as group data');
            }

            console.log('Extracted group data:', groupData);

            // Extract banking details from the group data
            let bankInfo = null;
            
            // First check for primary bank account fields directly in groupData
            if (groupData?.primary_bank_acc_holder || groupData?.primary_bank_acc_no || 
                groupData?.primary_bank_ifsc || groupData?.primary_bank_acc_type) {
                bankInfo = {
                    bank_acc_holder: groupData.primary_bank_acc_holder,
                    bank_acc_no: groupData.primary_bank_acc_no,
                    bank_ifsc: groupData.primary_bank_ifsc,
                    bank_acc_type: groupData.primary_bank_acc_type
                };
                console.log('Found primary bank info directly in groupData:', bankInfo);
            }
            
            // If not found, check in groupResponse directly
            if (!bankInfo && (groupResponse?.primary_bank_acc_holder || groupResponse?.primary_bank_acc_no || 
                             groupResponse?.primary_bank_ifsc || groupResponse?.primary_bank_acc_type)) {
                bankInfo = {
                    bank_acc_holder: groupResponse.primary_bank_acc_holder,
                    bank_acc_no: groupResponse.primary_bank_acc_no,
                    bank_ifsc: groupResponse.primary_bank_ifsc,
                    bank_acc_type: groupResponse.primary_bank_acc_type
                };
                console.log('Found primary bank info directly in groupResponse:', bankInfo);
            }
            
            // If still not found, check traditional banking_details arrays and objects
            if (!bankInfo) {
                const possibleBankPaths = [
                    groupData?.banking_details?.[0],
                    groupData?.banking_detail?.[0], 
                    groupData?.bank_details?.[0],
                    groupData?.bankDetails?.[0],
                    groupData?.banking_details,
                    groupData?.banking_detail,
                    groupData?.bank_details,
                    groupData?.bankDetails,
                    // Direct access patterns
                    groupResponse?.banking_details?.[0],
                    groupResponse?.banking_detail?.[0],
                    groupResponse?.bank_details?.[0],
                    groupResponse?.bankDetails?.[0]
                ];

                console.log('Searching for bank info in traditional paths...');
                
                for (let i = 0; i < possibleBankPaths.length; i++) {
                    const path = possibleBankPaths[i];                    
                    if (path && typeof path === 'object') {
                        // If it's an array, take the first element
                        if (Array.isArray(path) && path.length > 0) {
                            bankInfo = path[0];
                            console.log(`Found bank info in array at path ${i}:`, bankInfo);
                            break;
                        } 
                        // If it's an object with bank-related properties
                        else if (path.bank_acc_holder || path.accountHolder || path.holder || 
                                 path.bank_acc_no || path.accountNumber || path.number ||
                                 path.primary_bank_acc_holder || path.primary_bank_acc_no) {
                            bankInfo = path;
                            console.log(`Found bank info object at path ${i}:`, bankInfo);
                            break;
                        }
                    }
                }
            }

            if (!bankInfo) {
                console.warn('No bank information found in group data');
                setGroupDefaults();
                return;
            }

            console.log('Processing bank info:', bankInfo);

            // Clean and validate bank details with multiple field name variations including primary bank fields
            const cleanBankInfo = {
                bank_acc_type: String(
                    bankInfo.bank_acc_type || 
                    bankInfo.primary_bank_acc_type ||
                    bankInfo.accountType || 
                    bankInfo.account_type ||
                    bankInfo.type || 
                    ''
                ).trim(),
                bank_acc_holder: String(
                    bankInfo.bank_acc_holder || 
                    bankInfo.primary_bank_acc_holder ||
                    bankInfo.accountHolder || 
                    bankInfo.account_holder ||
                    bankInfo.holder || 
                    bankInfo.name ||
                    ''
                ).trim(),
                bank_acc_no: String(
                    bankInfo.bank_acc_no || 
                    bankInfo.primary_bank_acc_no ||
                    bankInfo.accountNumber || 
                    bankInfo.account_number ||
                    bankInfo.number || 
                    bankInfo.acc_no ||
                    ''
                ).trim(),
                bank_ifsc: String(
                    bankInfo.bank_ifsc || 
                    bankInfo.primary_bank_ifsc ||
                    bankInfo.ifsc || 
                    bankInfo.ifscCode || 
                    bankInfo.ifsc_code ||
                    ''
                ).trim()
            };

            console.log('Cleaned bank info:', cleanBankInfo);

            // Validate that we have meaningful data
            const hasAnyBankData = Object.values(cleanBankInfo).some(value => value.length > 0);
            
            if (!hasAnyBankData) {
                console.warn('Bank info object exists but all fields are empty');
                setGroupDefaults();
                return;
            }

            setGroupBankDetails(cleanBankInfo);
            
            // Check if all required fields are present and not empty
            const hasAllFields = cleanBankInfo.bank_acc_holder && 
                              cleanBankInfo.bank_acc_no && 
                              cleanBankInfo.bank_ifsc && 
                              cleanBankInfo.bank_acc_type;
            
            console.log('All required fields present:', hasAllFields);
            console.log('Individual field check:', {
                holder: Boolean(cleanBankInfo.bank_acc_holder),
                number: Boolean(cleanBankInfo.bank_acc_no), 
                ifsc: Boolean(cleanBankInfo.bank_ifsc),
                type: Boolean(cleanBankInfo.bank_acc_type)
            });

            setGroupHasBankAccount(true);
            setGroupBankDetailsIncomplete(!hasAllFields);
            
            // If bank details are complete, set toggle to ON by default
            if (hasAllFields) {
                console.log('Setting toggle to ON and populating form data');
                setUseGroupBankAccount(true);
                // Immediately set the form data with group bank details
                setFormData(prev => ({ 
                    ...prev, 
                    banking_details: [{ ...cleanBankInfo }] 
                }));
            } else {
                console.log('Bank details incomplete, keeping toggle OFF');
                setUseGroupBankAccount(false);
            }

        } catch (groupError) {
            console.error('Error fetching group data:', groupError);
            
            // Enhanced error logging
            if (groupError.response) {
                console.error('API Response Error:', {
                    status: groupError.response.status,
                    statusText: groupError.response.statusText,
                    data: groupError.response.data,
                    headers: groupError.response.headers
                });
                
                // Check for specific error cases
                if (groupError.response.status === 404) {
                    console.warn('Group not found (404) - this might be expected for some tickets');
                } else if (groupError.response.status === 403) {
                    console.warn('Access denied (403) - check permissions for this ticket');
                } else if (groupError.response.status === 500) {
                    console.error('Server error (500) - backend issue');
                }
            } else if (groupError.request) {
                console.error('Network Error - no response received:', groupError.request);
            } else {
                console.error('Request Setup Error:', groupError.message);
            }
            
            setGroupDefaults();
        }

    } catch (error) {
        console.error("Failed to fetch main ticket data:", error);
        if (error.response) {
            console.error('Ticket API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        setGroupDefaults();
    } finally {
        setPageLoading(false);
        setDataLoaded(true);
        console.log('fetchData completed');
    }
};
const setGroupDefaults = () => {
    setGroupHasBankAccount(false);
    setGroupBankDetailsIncomplete(false);
    setGroupBankDetails(null);
    setUseGroupBankAccount(false);
};
    useEffect(() => {
        fetchData();
    }, [ticketId]);
    
    const resetForm = () => {
        setFormData(initialFormState);
        setPreviews({ ticket_layout: null, event_banner: null, event_logo: null });
        setEditingSubEventId(null);
        setIsEditingSubEvent(false);
        if (rulesEditorRef.current) rulesEditorRef.current.innerHTML = '';
        if (descriptionEditorRef.current) descriptionEditorRef.current.innerHTML = '';
    };
    useEffect(() => { 
        if (ticketId) {
            fetchData();
        } else {
            console.error('No ticketId available, skipping data fetch');
        }
    }, [ticketId]);
    const renderBankingSection = () => {
        if (pageLoading) {
            return (
                <div className="space-y-4">
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-64 rounded"></div>
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 w-full rounded"></div>
                </div>
            );
        }

        return (
            <div className='space-y-12 animate-fade-in'>
                <section className="bg-white dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 shadow-sm dark:shadow-none">
                    {/* Debug info panel (remove in production) */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
                        <p><strong>Debug Info:</strong></p>
                        <p>TicketId: {ticketId}</p>
                        <p>Group Has Bank Account: {String(groupHasBankAccount)}</p>
                        <p>Bank Details Incomplete: {String(groupBankDetailsIncomplete)}</p>
                        <p>Use Group Account: {String(useGroupBankAccount)}</p>
                        <p>Bank Details Available: {String(Boolean(groupBankDetails))}</p>
                    </div>

                    {/* Rest of your banking section JSX */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <label className={`font-medium text-md ${groupHasBankAccount && !groupBankDetailsIncomplete ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                Do you want to use the bank account used for group creation?
                            </label>
                            {/* ... rest of your existing JSX ... */}
                        </div>
                    </div>
                    {/* ... rest of your banking section JSX ... */}
                </section>
            </div>
        );
    };
    // FIX: Refined useEffect to correctly apply group bank details when toggled
    useEffect(() => {
        if (useGroupBankAccount && groupBankDetails && !groupBankDetailsIncomplete) {
            setFormData(prev => ({ ...prev, banking_details: [groupBankDetails] }));
        }
    }, [useGroupBankAccount, groupBankDetails, groupBankDetailsIncomplete]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationTypeChange = (type) => {
        setFormData(prev => ({ ...prev, location_type: type.toLowerCase() }));
    };
    
    const handleToggleChange = (name) => {
        setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const handleTagChange = (name, newTags) => {
        setFormData((prev) => ({ ...prev, [name]: newTags }));
    };

    const handleDatesSave = (newDates, dateType) => {
        setFormData((prev) => ({
            ...prev,
            event_dates: newDates,
            event_date_type: dateType,
        }));
    };

    const removeDate = (dateToRemove) => {
        setFormData((prev) => ({
            ...prev,
            event_dates: prev.event_dates.filter((d) => d.date !== dateToRemove),
        }));
    };

    const handleGuestsSave = (newGuests) => {
        setFormData((prev) => ({ ...prev, guests: newGuests }));
    };

    const handleEditGuest = (guest) => {
        setEditingGuest(guest);
        setIsGuestModalOpen(true);
    };

    const handleFormat = (command, ref) => {
        if (ref.current) {
            document.execCommand(command, false, null);
            ref.current.focus();
        }
    };
    
    const handleProhibitedItemsSave = (newItems) => {
        setFormData((prev) => ({ ...prev, prohibited_items: newItems }));
    };

    const removeProhibitedItem = (itemToRemove) => {
        setFormData((prev) => ({
            ...prev,
            prohibited_items: prev.prohibited_items.filter((item) => item !== itemToRemove),
        }));
    };

    const handlePocChange = (e) => {
        setPoc({ ...poc, [e.target.name]: e.target.value });
    };

    const handleAddPoc = () => {
        if (poc.POC_name.trim() && poc.POC_email.trim() && poc.POC_contact.trim()) {
            setFormData((prev) => ({ ...prev, POCS: [...prev.POCS, poc] }));
            setPoc({ POC_name: '', POC_email: '', POC_contact: '' });
        } else {
            alert("Please fill all Point of Contact fields.");
        }
    };

    const handleRemovePoc = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            POCS: prev.POCS.filter((_, index) => index !== indexToRemove),
        }));
    };
    
    const handleMediaFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
        }
    };

    const removeMediaFile = (type) => {
        setFormData(prev => ({ ...prev, [type]: null }));
        setPreviews(prev => ({ ...prev, [type]: null }));
    };

    const handleMultiMediaChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length === 0) return;

        setFormData(prev => {
            const currentFiles = prev.event_images;
            const filesToAdd = newFiles.slice(0, 10 - currentFiles.length);
            if (newFiles.length > filesToAdd.length) {
                 alert(`You can only upload a maximum of 10 images. ${filesToAdd.length} were added.`);
            }
            return { ...prev, event_images: [...currentFiles, ...filesToAdd] };
        });
        e.target.value = '';
    };

    const handleRemoveLastImage = () => {
        setFormData(prev => {
            const updatedImages = prev.event_images.slice(0, -1);
            if (updatedImages.length < 2) setShowExtraMedia(false);
            return { ...prev, event_images: updatedImages };
        });
    };
    
    const handleSaveOrUpdateTickets = (updatedTickets) => {
        setFormData(prev => ({ ...prev, ticket_types: updatedTickets }));
    };

    const handleDeleteTicket = (ticketIdToDelete) => {
        setFormData(prev => ({ ...prev, ticket_types: prev.ticket_types.filter(t => t.id !== ticketIdToDelete) }));
    };
    
    const handleBankingDetailChange = (index, event) => {
    const { name, value } = event.target;
    setFormData(prev => {
        const newBankingDetails = [...prev.banking_details];
        // Ensure the object exists
        if (!newBankingDetails[index]) {
            newBankingDetails[index] = { 
                bank_acc_type: '', 
                bank_acc_holder: '', 
                bank_acc_no: '', 
                bank_ifsc: '' 
            };
        }
        newBankingDetails[index] = {
            ...newBankingDetails[index],
            [name]: value || '' // Ensure never undefined
        };
        return { ...prev, banking_details: newBankingDetails };
    });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const submissionForm = new FormData();
        const eventDateTypeMap = {
          "Single day": "one-day",
          "Multi days": "multi-day",
          Weekly: "weekly",
        };
        // 1. Map the frontend state to the exact structure the backend expects
        const subEventPayload = {
            event_name: formData.event_name,
            event_category: formData.event_category,
            event_subcategory: formData.event_subcategory,
            event_type: formData.event_type,
            event_language: [formData.event_language], // Backend expects an array
            min_age_allowed: Number(formData.min_age_allowed),
            kids_friendly: formData.kids_friendly,
            pet_friendly: formData.pet_friendly,
            location_type: formData.location_type,
            event_date_type:
              eventDateTypeMap[formData.event_date_type] || "one-day",
            gate_open_time: formData.gate_open_time
              ? formData.gate_open_time?.trim() || ""
              : "",
            event_dates: formData.event_dates.map(d => ({
                start_date: d.date,
                end_date: d.date, // Assuming single-day entries
                start_time: d.startTime,
                end_time: d.endTime
            })),
            event_instagram_link: formData.event_instagram_link,
            event_youtube_link: formData.event_youtube_link,
            event_description: descriptionEditorRef.current?.innerHTML || '',
            event_rules_text: rulesEditorRef.current?.innerHTML || '',
            hashtag: JSON.stringify(formData.hashtag),
            prohibited_items: JSON.stringify(formData.prohibited_items),
            payment_type: formData.payment_type,
            POCS: formData.POCS,
            guests: formData.guests.map(g => ({ guest_name: g.name, guest_link: g.link })),
        };

        // 2. Conditionally add fields based on payment and location types
        if (formData.payment_type === 'paid') {
            subEventPayload.banking_details = formData.banking_details;
            subEventPayload.booking_start_date = formData.booking_start_date;
            subEventPayload.booking_end_date = formData.booking_end_date;
        }
        if (formData.location_type === 'offline') {
            subEventPayload.location = formData.location;
            subEventPayload.venue = formData.venue;
            subEventPayload.seating_arrangement = formData.seating_arrangement;
            subEventPayload.exact_map_location = formData.exact_map_location;
            subEventPayload.gate_open_time = formData.gate_open_time;
            subEventPayload.total_capacity = formData.total_capacity;
            if (formData.payment_type === 'paid') {
                subEventPayload.ticket_types = formData.ticket_types.map(t => ({
                    ticket_type: t.name,
                    ticket_price: Number(t.price),
                    max_capacity: Number(t.capacity)
                }));
            }
        } else {
            subEventPayload.event_link = formData.event_link;
        }

        // 3. Append the stringified JSON payload to the form data
        submissionForm.append('sub_event', JSON.stringify(subEventPayload));

        // 4. Append all files to the form data
        if (formData.event_banner) submissionForm.append('event_banner', formData.event_banner);
        if (formData.event_logo) submissionForm.append('event_logo', formData.event_logo);
        if (formData.event_rules_file) submissionForm.append('event_rules', formData.event_rules_file);
        if (formData.ticket_layout) submissionForm.append('ticket_layout', formData.ticket_layout);

        formData.event_images.forEach(file => submissionForm.append('event_images', file));
        formData.guests.forEach((guest, index) => {
            if (guest.rawFile) submissionForm.append(`guest_profile_${index}`, guest.rawFile);
        });
        
        if(formData.location_type === 'offline' && formData.payment_type === 'paid') {
            formData.ticket_types.forEach((ticket, index) => {
                if (ticket.photoFile) submissionForm.append(`ticket_photo_${index}`, ticket.photoFile);
            });
        }
        
        // 5. Submit the form and handle the response
        try {
            await updateTicketAddOns(ticketId, submissionForm);
            alert("Sub-event added successfully!");
            // Navigate to ticket-terms only for "Save and continue"
            navigate(`/ticket/ticket-terms/${ticketId}`);
        } catch (error) {
            console.error("Error submitting form:", error.response ? error.response.data : error);
            alert(`Submission failed: ${error.response?.data?.message || 'An error occurred.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    const currentBankDetail = formData.banking_details[0] || {};
    const [dataLoaded, setDataLoaded] = useState(false);
    const saveFormDataToStorage = (data) => {
      try {
      const { ...dataToSave } = data; // File objects can't be stored
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
      console.error("Error saving data to localStorage:", error);
      }
    };
    useEffect(() => {
        if (formData.event_name || formData.location) {
          saveFormDataToStorage(formData);
        }
      }, [formData]);
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
    useEffect(() => {
      setDataLoaded(true);
    }, []);
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
    
    // Ensure map renders properly with resize trigger
    setTimeout(() => {
      if (mapInstance && mapRef.current) {
        window.google.maps.event.trigger(mapInstance, 'resize');
        mapInstance.setCenter(initialCenter);
        mapInstance.setZoom(15);
      }
    }, 100);
  };
  
  initializeMap();
    }, [isApiReady, formData.location_type, dataLoaded]);
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
  if (!formData.location || !isApiReady || !window.google || formData.location_type !== 'offline' || !map) {
    return;
  }
  const geocodeTimeout = setTimeout(() => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: formData.location }, (results, status) => {
      if (status === "OK" && results[0] && markerRef.current) {
        const { lat, lng } = results[0].geometry.location;
        const newPosition = { lat: lat(), lng: lng() };
        
        // Only update coordinates, not the location field to avoid conflicts
        setFormData((prev) => ({
          ...prev,
          exact_map_location: {
            latitude: lat().toString(),
            longitude: lng().toString(),
            address: results[0].formatted_address,
          },
        }));
        
        map.setCenter(newPosition);
        map.setZoom(15);
        markerRef.current.setPosition(newPosition);
      }
    });
  }, 1500); // Wait 1.5 seconds after user stops typing

  return () => clearTimeout(geocodeTimeout);
      }, [formData.location, isApiReady, map, formData.location_type]);
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
      useEffect(() => {
          if (formData.payment_type === 'paid' && renderBankingSection()) {
              // Ensure banking_details is always defined when payment is paid
              if (!formData.banking_details || formData.banking_details.length === 0) {
                  if (useGroupBankAccount && groupBankDetails) {
                      setFormData(prev => ({ 
                          ...prev, 
                          banking_details: [{ ...groupBankDetails }] 
                      }));
                  } else {
                      setFormData(prev => ({ 
                          ...prev, 
                          banking_details: [{ 
                              bank_acc_type: '', 
                              bank_acc_holder: '', 
                              bank_acc_no: '', 
                              bank_ifsc: '' 
                          }] 
                      }));
                  }
              }
          }
      }, [formData.payment_type, useGroupBankAccount, groupBankDetails]);
      const getCurrentBankDetail = () => {
          return formData.banking_details?.[0] || { 
              bank_acc_type: '', 
              bank_acc_holder: '', 
              bank_acc_no: '', 
              bank_ifsc: '' 
          };
      };
      const handleUseGroupBankAccountToggle = () => {
        if (!groupHasBankAccount || groupBankDetailsIncomplete) {
            return;
        }
    
        const newToggleState = !useGroupBankAccount;
        setUseGroupBankAccount(newToggleState);
        
        if (newToggleState && groupBankDetails) {
            // Use group bank details
            setFormData(prev => ({ 
                ...prev, 
                banking_details: [{ ...groupBankDetails }] 
            }));
        } else {
            // Reset to empty but controlled fields
            setFormData(prev => ({ 
                ...prev, 
                banking_details: [{ 
                    bank_acc_type: '', 
                    bank_acc_holder: '', 
                    bank_acc_no: '', 
                    bank_ifsc: '' 
                }] 
            }));
        }
      };
      const handleSaveAndAddMore = async (e) => {
          if (e) e.preventDefault();
          try {
              setIsSubmitting(true);
              // Save current sub-event
              const submissionForm = new FormData();
              const eventDateTypeMap = {
                  "Single day": "one-day",
                  "Multi days": "multi-day",
                  Weekly: "weekly",
              };
              // Create payload (same as in handleSubmit)
              const subEventPayload = {
                  event_name: formData.event_name,
                  event_category: formData.event_category,
                  event_subcategory: formData.event_subcategory,
                  event_type: formData.event_type,
                  event_language: [formData.event_language],
                  min_age_allowed: Number(formData.min_age_allowed),
                  kids_friendly: formData.kids_friendly,
                  pet_friendly: formData.pet_friendly,
                  location_type: formData.location_type,
                  event_date_type: eventDateTypeMap[formData.event_date_type] || "one-day",
                  gate_open_time: formData.gate_open_time ? formData.gate_open_time?.trim() || "" : "",
                  event_dates: formData.event_dates.map(d => ({
                      start_date: d.date,
                      end_date: d.date,
                      start_time: d.startTime,
                      end_time: d.endTime
                  })),
                  event_instagram_link: formData.event_instagram_link,
                  event_youtube_link: formData.event_youtube_link,
                  event_description: descriptionEditorRef.current?.innerHTML || '',
                  event_rules_text: rulesEditorRef.current?.innerHTML || '',
                  hashtag: JSON.stringify(formData.hashtag),
                  prohibited_items: JSON.stringify(formData.prohibited_items),
                  payment_type: formData.payment_type,
                  POCS: formData.POCS,
                  guests: formData.guests.map(g => ({ guest_name: g.name, guest_link: g.link })),
              };

              // Add conditional fields
              if (formData.payment_type === 'paid') {
                  subEventPayload.banking_details = formData.banking_details;
                  subEventPayload.booking_start_date = formData.booking_start_date;
                  subEventPayload.booking_end_date = formData.booking_end_date;
              }
              
              if (formData.location_type === 'offline') {
                  subEventPayload.location = formData.location;
                  subEventPayload.venue = formData.venue;
                  subEventPayload.seating_arrangement = formData.seating_arrangement;
                  subEventPayload.exact_map_location = formData.exact_map_location;
                  subEventPayload.gate_open_time = formData.gate_open_time;
                  subEventPayload.total_capacity = formData.total_capacity;
                  if (formData.payment_type === 'paid') {
                      subEventPayload.ticket_types = formData.ticket_types.map(t => ({
                          ticket_type: t.name,
                          ticket_price: Number(t.price),
                          max_capacity: Number(t.capacity)
                      }));
                  }
              } else {
                  subEventPayload.event_link = formData.event_link;
              }

              // If editing, add sub-event ID
              if (isEditingSubEvent && editingSubEventId) {
                  subEventPayload.sub_event_id = editingSubEventId;
              }

              submissionForm.append('sub_event', JSON.stringify(subEventPayload));

              // Append files
              if (formData.event_banner) submissionForm.append('event_banner', formData.event_banner);
              if (formData.event_logo) submissionForm.append('event_logo', formData.event_logo);
              if (formData.event_rules_file) submissionForm.append('event_rules', formData.event_rules_file);
              if (formData.ticket_layout) submissionForm.append('ticket_layout', formData.ticket_layout);

              formData.event_images.forEach(file => submissionForm.append('event_images', file));
              formData.guests.forEach((guest, index) => {
                  if (guest.rawFile) submissionForm.append(`guest_profile_${index}`, guest.rawFile);
              });
              
              if(formData.location_type === 'offline' && formData.payment_type === 'paid') {
                  formData.ticket_types.forEach((ticket, index) => {
                      if (ticket.photoFile) submissionForm.append(`ticket_photo_${index}`, ticket.photoFile);
                  });
              }
              
              try {
                  await updateTicketAddOns(ticketId, submissionForm);
                  alert(isEditingSubEvent ? "Sub-event updated successfully!" : "Sub-event added successfully!");
                  
                  // Reset form for new entry and stay on same page
                  resetForm();
                  await fetchData(); // Refresh the existing events list
                  // Scroll to top
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  
              } catch (error) {
                  console.error("Error submitting form:", error.response ? error.response.data : error);
                  alert(`Submission failed: ${error.response?.data?.message || 'An error occurred.'}`);
              }
          } catch (error) {
              console.error("Error saving sub-event:", error);
              alert(`Failed to save sub-event: ${error.response?.data?.message || 'An error occurred.'}`);
    } finally {
        setIsSubmitting(false);
    }
};
      // Add this function to your UpdateTicketAddOns component
      const handleSubEventClick = async (subEventId) => {
          console.log('Sub-event ID:', subEventId);
          setEditingSubEventId(subEventId);
          setIsEditingSubEvent(true);
          await populateFormWithSubEventData(subEventId);
          
          // Scroll to form
          window.scrollTo({ top: 400, behavior: 'smooth' });
      };
      const populateFormWithSubEventData = async (subEventId) => {
          setSubEventLoading(true);
          try {
              const subEvent = existingSubEvents.find(event => event._id === subEventId);
              if (subEvent) {
                  // Map event dates with proper format conversion
                  const mappedEventDates = subEvent.event_dates?.map(date => {
                      // Convert 24-hour format to 12-hour format for display
                      const convertTo12Hour = (time24h) => {
                          if (!time24h) return { time: '', ampm: '' };
                          const [hours, minutes] = time24h.split(':');
                          let hour12 = parseInt(hours);
                          const ampm = hour12 >= 12 ? 'PM' : 'AM';
                          if (hour12 === 0) hour12 = 12;
                          else if (hour12 > 12) hour12 -= 12;
                          return {
                              time: `${hour12.toString().padStart(2, '0')}:${minutes}`,
                              ampm: ampm
                          };
                      };

                      const startTime12 = convertTo12Hour(date.start_time);
                      const endTime12 = convertTo12Hour(date.end_time);

                      return {
                          date: date.start_date,
                          endDate: date.end_date || date.start_date,
                          startTime: startTime12.time,
                          endTime: endTime12.time,
                          startAmPm: startTime12.ampm,
                          endAmPm: endTime12.ampm,
                          // Keep original 24-hour format for backend compatibility
                          startTime24h: date.start_time,
                          endTime24h: date.end_time
                      };
                  }) || [];

                  // Convert event_date_type from backend format to frontend format
                  const eventDateTypeMap = {
                      "one-day": "Single day",
                      "multi-day": "Multi days",
                      "weekly": "Weekly"
                  };

                  setFormData(prev => ({
                      ...prev,
                      event_name: subEvent.event_name || '',
                      event_category: subEvent.event_category || '',
                      event_subcategory: subEvent.event_subcategory || '',
                      event_type: subEvent.event_type || 'public',
                      location_type: subEvent.location_type || 'offline',
                      event_link: subEvent.event_link || '',
                      location: subEvent.location || '',
                      venue: subEvent.venue || '',
                      event_language: subEvent.event_language?.[0] || '',
                      min_age_allowed: subEvent.min_age_allowed || '',
                      seating_arrangement: subEvent.seating_arrangement || '',
                      kids_friendly: subEvent.kids_friendly || false,
                      pet_friendly: subEvent.pet_friendly || false,
                      event_instagram_link: subEvent.event_instagram_link || '',
                      event_youtube_link: subEvent.event_youtube_link || '',
                      hashtag: Array.isArray(subEvent.hashtag) ? subEvent.hashtag : 
                              (typeof subEvent.hashtag === 'string' ? JSON.parse(subEvent.hashtag || '[]') : []),
                      event_dates: mappedEventDates,
                      event_date_type: eventDateTypeMap[subEvent.event_date_type] || "Single day",
                      gate_open_time: Boolean(subEvent.gate_open_time) || '',
                      guests: subEvent.guests?.map(g => ({
                          id: Date.now() + Math.random(),
                          name: g.guest_name,
                          link: g.guest_link,
                          image: g.guest_image || `https://i.pravatar.cc/150?u=${Date.now()}`,
                          rawFile: null // Can't restore file objects
                      })) || [],
                      prohibited_items: Array.isArray(subEvent.prohibited_items) ? subEvent.prohibited_items :
                                      (typeof subEvent.prohibited_items === 'string' ? JSON.parse(subEvent.prohibited_items || '[]') : []),
                      POCS: subEvent.POCS || [],
                      payment_type: subEvent.payment_type || 'free',
                      banking_details: subEvent.banking_details || [{ 
                          bank_acc_type: '', 
                          bank_acc_holder: '', 
                          bank_acc_no: '', 
                          bank_ifsc: '' 
                      }],
                      booking_start_date: subEvent.booking_start_date || '',
                      booking_end_date: subEvent.booking_end_date || '',
                      ticket_types: subEvent.ticket_types?.map(t => ({
                          id: Date.now() + Math.random(),
                          name: t.ticket_type,
                          price: t.ticket_price,
                          capacity: t.max_capacity,
                          image: t.ticket_image || `https://i.pravatar.cc/150?u=${Date.now()}`,
                          photoFile: null // Can't restore file objects
                      })) || [],
                      total_capacity: subEvent.total_capacity || '',
                      exact_map_location: subEvent.exact_map_location || {
                          latitude: INITIAL_MAP_LOCATION.lat.toString(),
                          longitude: INITIAL_MAP_LOCATION.lng.toString(),
                          address: INITIAL_MAP_LOCATION.address
                      }
                  }));

                  // Set media previews if available
                  setPreviews(prev => ({
                      ...prev,
                      event_banner: subEvent.event_banner || null,
                      event_logo: subEvent.event_logo || null,
                      ticket_layout: subEvent.ticket_layout || null
                  }));

                  // Handle multiple event images
                  if (subEvent.event_images && subEvent.event_images.length > 0) {
                      // Note: We can't restore actual File objects, but we can show previews
                      // You might want to create placeholder File objects or handle this differently
                      setFormData(prev => ({
                          ...prev,
                          event_images: [] // Reset since we can't restore File objects
                      }));
                      
                      // Set showExtraMedia if there are multiple images
                      if (subEvent.event_images.length > 1) {
                          setShowExtraMedia(true);
                      }
                  }

                  // Set content for rich text editors
                  if (descriptionEditorRef.current) {
                      descriptionEditorRef.current.innerHTML = subEvent.event_description || '';
                  }
                  if (rulesEditorRef.current) {
                      rulesEditorRef.current.innerHTML = subEvent.event_rules_text || '';
                  }

                  // Set seating layout toggle if ticket_layout exists
                  if (subEvent.ticket_layout) {
                      setHasSeatingLayout(true);
                  }

                  // Handle gate opening time parsing for 12-hour format inputs
                  if (subEvent.gate_open_time) {
                      const gateTime12 = convertTo12Hour(subEvent.gate_open_time);
                      setFormData(prev => ({
                          ...prev,
                          gate_open_hour: gateTime12.time.split(':')[0],
                          gate_open_minute: gateTime12.time.split(':')[1],
                          gate_open_ampm: gateTime12.ampm,
                          gate_open_time: true
                      }));
                  }

                  console.log('Sub-event data loaded successfully:', subEvent);
              }
          } catch (error) {
              console.error('Error loading sub-event data:', error);
              alert('Failed to load sub-event data');
          } finally {
              setSubEventLoading(false);
          }
      };
    return (
        <>
            {/* All modals go here */}
            <DatePickerModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} onSave={handleDatesSave} initialDates={formData.event_dates} darkMode={darkMode} />
            <GuestModal isOpen={isGuestModalOpen} onClose={() => { setIsGuestModalOpen(false); setEditingGuest(null); }} onSave={handleGuestsSave} initialGuests={formData.guests} editingGuest={editingGuest} darkMode={darkMode} />
            <ProhibitedItemsModal isOpen={isProhibitedModalOpen} onClose={() => setIsProhibitedModalOpen(false)} onSave={handleProhibitedItemsSave} initialItems={formData.prohibited_items} darkMode={darkMode} />
            <CreateTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onSave={handleSaveOrUpdateTickets} editingTicket={editingTicket} existingTickets={formData.ticket_types} />

        <div className={`${darkMode ? "dark" : ""}`}>
            <div className="bg-white dark:bg-[#212426] text-gray-800 dark:text-white min-h-screen flex">
                <EventSidebar
                    darkMode={darkMode}
                    progress={84}
                    handleBack={() => navigate(`/ticket/ticket-terms/${ticketId}`)}
                />
                <main className="flex-1 relative p-4 sm:p-6 md:p-8 overflow-y-auto">
                    <div className="absolute top-6 right-6 z-10">
                        <ThemeToggle isDark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                    </div>

                    <div className="w-full max-w-5xl mx-auto">
                        <header className="text-center mt-4 mb-12">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Add Extra Shows / Add Multiples Events</h1>
                            <p className="text-gray-500 dark:text-gray-400">Add and manage all the sub-events associated with your main ticket.</p>
                        </header>
                        {isEditingSubEvent && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-800 dark:text-blue-200 font-medium">
                                            Editing Sub-Event: {formData.event_name || 'Untitled Event'}
                                        </p>
                                        <p className="text-blue-600 dark:text-blue-300 text-sm">
                                            Make your changes below and click "Save and continue" or "Add more sub events"
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        Cancel Edit
                                    </button>
                                </div>
                            </div>
                        )}
                     <div className="mb-12">
                        <h2 className="text-xl font-semibold mb-4">Your Existing Events</h2>
                        {loading ? (
                            <p>Loading events...</p>
                        ) : (
                            <>
                                {existingSubEvents.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {existingSubEvents.map((event, index) => (
                                            <div 
                                                key={index} 
                                                onClick={() => handleSubEventClick(event._id)}
                                                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-white"
                                            >
                                                <div className="p-4 flex items-center">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg mb-1 truncate">
                                                            {event.event_name}
                                                        </h3>
                                                        <p className="text-sm opacity-90 mb-2">
                                                            {event.event_category}
                                                        </p>
                                                        {/* Optional: Add more details */}
                                                        {event.event_dates && event.event_dates.length > 0 && (
                                                            <p className="text-xs opacity-80">
                                                                {new Date(event.event_dates[0].start_date).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {/* Edit icon */}
                                                    <div className="ml-3">
                                                        <svg 
                                                            className="w-5 h-5" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                strokeWidth={2} 
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No sub-events have been added yet.
                                    </p>
                                )}
                                
                                {/* Add Another Event Button */}
                                {existingSubEvents.length > 0 && !isEditingSubEvent && (
                                    <div className="mt-6 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                                        >
                                            + Add Another Event
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                        {/* --- FORM START --- */}
                        <form className="space-y-12" onSubmit={handleSubmit}>
                            {/* --- EVENT DETAILS SECTION --- */}
                            <div className="space-y-8">
                                {/*... Other input fields like event_name, category etc. (No changes needed) ...*/}
                                 <div>
                                    <label htmlFor="event_name" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        Event name<span className="text-red-400">*</span>
                                        <InfoTooltip note="The public title of your event." />
                                    </label>
                                    <input id="event_name" name="event_name" type="text" value={formData.event_name} onChange={handleInputChange} required placeholder="Enter your event name here..."
                                        className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label htmlFor="event_category" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Event category<span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <select id="event_category" name="event_category" value={formData.event_category} onChange={handleInputChange} required
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg text-gray-800 dark:text-gray-200 appearance-none focus:outline-none border-gray-300 dark:border-[#4A4A4A] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50">
                                                <option className="dark:bg-gray-700" value="">Select category</option>
                                                <option className="dark:bg-gray-700" value="Technology">Technology</option>
                                                <option className="dark:bg-gray-700" value="Music">Music</option>
                                                <option className="dark:bg-gray-700" value="Conference">Conference</option>
                                                <option className="dark:bg-gray-700" value="Workshop">Workshop</option>
                                                <option className="dark:bg-gray-700" value="Sports">Sports</option>
                                                <option className="dark:bg-gray-700" value="Art">Art</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="event_subcategory" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Event subcategory<span className="text-red-400">*</span>
                                        </label>
                                        <input id="event_subcategory" name="event_subcategory" type="text" value={formData.event_subcategory} onChange={handleInputChange} required placeholder="e.g., AI Conference"
                                            className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Event type<span className="text-red-400">*</span></label>
                                    <div className="flex items-center space-x-6">
                                        <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300"><input type="radio" name="event_type" value="public" checked={formData.event_type === 'public'} onChange={handleInputChange} className="hidden peer" /><span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100"></span></span><span className="ml-2">Public</span></label>
                                        <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300"><input type="radio" name="event_type" value="private" checked={formData.event_type === 'private'} onChange={handleInputChange} className="hidden peer" /><span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-300 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100"></span></span><span className="ml-2">Private</span></label>
                                    </div>
                                </div>
                            </div>

                            {/* --- LOCATION SECTION --- */}
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Location</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Choose where your event will take place</p>
                                </div>
                                <div>
                                    <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Event location type<span className="text-red-400">*</span></label>
                                    <div className="flex items-center space-x-4">
                                        {['Offline', 'Online', 'Recorded'].map((type) => (
                                            <button key={type} type="button" onClick={() => handleLocationTypeChange(type)}
                                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${formData.location_type === type.toLowerCase() ? "bg-[#10B981] text-white shadow-lg" : "bg-gray-200 dark:bg-[#374151] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {formData.location_type === 'offline' && (
                                  <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div>
                                        <label htmlFor="location" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                          Event location<span className="text-red-400">*</span>
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
                                        <label htmlFor="venue" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                          Event venue<span className="text-red-400">*</span>
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
                                        className="w-full h-80 rounded-lg border bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-[#4A4A4A]"
                                        style={{ 
                                          minHeight: "320px",
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {!isApiReady && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                            <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Click anywhere on the map or drag the marker to set the exact location. 
                                        You can also search in the location field above.
                                      </div>
                                    </div>

                                    {formData.exact_map_location.latitude && formData.exact_map_location.longitude && (
                                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                          <strong>Selected Location:</strong>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                          Lat: {formData.exact_map_location.latitude}, Lng: {formData.exact_map_location.longitude}
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
                                
                                {(formData.location_type === 'online' || formData.location_type === 'recorded') && (
                                    <div className="space-y-4 animate-fade-in">
                                        <label htmlFor="event_link" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Event Link<span className="text-red-400">*</span></label>
                                        <input id="event_link" name="event_link" type="url" value={formData.event_link} onChange={handleInputChange} required placeholder="https://zoom.us/j/..."
                                            className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50" />
                                    </div>
                                )}
                            </div>
                           
                           {/* --- MORE DETAILS SECTION --- */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label htmlFor="event_language" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Event language<span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <select id="event_language" name="event_language" value={formData.event_language} onChange={handleInputChange} required
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg text-gray-800 dark:text-gray-200 appearance-none border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50">
                                                <option className="dark:bg-gray-700" value="">Select language</option>
                                                <option className="dark:bg-gray-700" value="English">English</option>
                                                <option className="dark:bg-gray-700" value="Malayalam">Malayalam</option>
                                                <option className="dark:bg-gray-700" value="Hindi">Hindi</option>
                                                <option className="dark:bg-gray-700" value="Tamil">Tamil</option>
                                                <option className="dark:bg-gray-700" value="Other">Other</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="min_age_allowed" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Minimum age allowed<span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <select id="min_age_allowed" name="min_age_allowed" value={formData.min_age_allowed} onChange={handleInputChange} required
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg text-gray-800 dark:text-gray-200 appearance-none border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50">
                                                <option className="dark:bg-gray-700" value="">Select minimum age</option>
                                                <option className="dark:bg-gray-700" value="0">All ages</option>
                                                <option className="dark:bg-gray-700" value="13">13+</option>
                                                <option className="dark:bg-gray-700" value="16">16+</option>
                                                <option className="dark:bg-gray-700" value="18">18+</option>
                                                <option className="dark:bg-gray-700" value="21">21+</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {formData.location_type === 'offline' && (
                                    <div className="animate-fade-in">
                                        <label htmlFor="seating_arrangement" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Seating arrangement<span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <select id="seating_arrangement" name="seating_arrangement" value={formData.seating_arrangement} onChange={handleInputChange} required={formData.location_type === 'offline'}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg text-gray-800 dark:text-gray-200 appearance-none border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50">
                                                <option className="dark:bg-gray-700" value="">Select a type</option>
                                                <option className="dark:bg-gray-700" value="seated">Seated</option>
                                                <option className="dark:bg-gray-700" value="standing">Standing</option>
                                                <option className="dark:bg-gray-700" value="seated and standing">Seated and Standing</option>
                                                <option className="dark:bg-gray-700" value="other">Other</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <label className="font-medium text-gray-900 dark:text-white text-md">Is this event kid friendly?</label>
                                        <ToggleSwitch checked={formData.kids_friendly} onChange={() => handleToggleChange("kids_friendly")} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="font-medium text-gray-900 dark:text-white text-md">Is this event pet friendly?</label>
                                        <ToggleSwitch checked={formData.pet_friendly} onChange={() => handleToggleChange("pet_friendly")} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label htmlFor="event_instagram_link" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Instagram link (Optional)
                                        </label>
                                        <input id="event_instagram_link" name="event_instagram_link" type="url" value={formData.event_instagram_link} onChange={handleInputChange} placeholder="https://instagram.com/..."
                                            className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50" />
                                    </div>
                                    <div>
                                        <label htmlFor="event_youtube_link" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Youtube link (Optional)
                                        </label>
                                        <input id="event_youtube_link" name="event_youtube_link" type="url" value={formData.event_youtube_link} onChange={handleInputChange} placeholder="https://youtube.com/..."
                                            className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50" />
                                    </div>
                                </div>
                                
                                <div>
                                    <TagInput label="Event hashtags (Optional)" tags={formData.hashtag} onTagsChange={(newTags) => handleTagChange("hashtag", newTags)} placeholder="Eg. #Concert" darkMode={darkMode} />
                                </div>
                            </div>

                            {/* --- DATES AND TIMES SECTION --- */}
                            <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dates and times</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Choose when your sub-event will take place.</p>
                                    
                                    <div>
                                        <button type="button" onClick={() => setIsDateModalOpen(true)}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2">
                                            Add dates and time
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        </button>
                                    </div>

                                    {formData.event_dates.length > 0 && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates you selected</label>
                                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                              {formData.event_dates.map((item, index) => (
                                                  <div key={index} className="bg-gray-100 dark:bg-[#2B2B2B] rounded-lg p-3 text-center text-sm font-semibold relative">
                                                      {new Date(item.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                      <button onClick={() => removeDate(item.date)} type="button" className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">&times;</button>
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
                                                checked={Boolean(formData.gate_open_time)} // This ensures it's always a boolean
                                                onChange={() => handleToggleChange("gate_open_time")}
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

                                          {formData.gate_open_time && (
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
                                
                            {/* --- GUEST/RULES/DESCRIPTION SECTION --- */}
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Guest/Guide/Artists details</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Enter details of the person guiding or managing the event.</p>
                                    
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingGuest(null);
                                            setIsGuestModalOpen(true);
                                        }}
                                        className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white flex items-center gap-2">
                                        Add guest/guides
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                                    </button>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                        {formData.guests.map((guest) => (
                                            <div key={guest.id} className={`rounded-lg p-3 flex items-center justify-between ${darkMode ? "bg-[#2B2B2B]" : "bg-gray-100"}`}>
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <img src={guest.image} alt={guest.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                    <div className="truncate">
                                                        <p className="font-semibold truncate">{guest.name}</p>
                                                        {guest.link && <a href={guest.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 truncate block">{guest.link}</a>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center flex-shrink-0">
                                                    <button type="button" onClick={() => handleEditGuest(guest)} className={`p-2 ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`} title="Edit">
                                                        ✏️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event rules and regulations</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Describe your event rules and regulations</p>
                                    </div>
                                    <div className={`bg-transparent border rounded-lg ${darkMode ? "border-[#4A4A4A]" : "border-gray-300"}`}>
                                        <div className={`p-2 border-b ${darkMode ? "border-[#4A4A4A]" : "border-gray-300"} flex items-center space-x-1`}>
                                            <button type="button" onClick={() => handleFormat("bold", rulesEditorRef)} className={`w-8 h-8 flex items-center justify-center rounded font-bold ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>B</button>
                                            <button type="button" onClick={() => handleFormat("italic", rulesEditorRef)} className={`w-8 h-8 flex items-center justify-center rounded italic ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>I</button>
                                            <button type="button" onClick={() => handleFormat("underline", rulesEditorRef)} className={`w-8 h-8 flex items-center justify-center rounded underline ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>U</button>
                                        </div>
                                        <div ref={rulesEditorRef} contentEditable="true"
                                            className="w-full min-h-[120px] p-3 focus:outline-none"
                                        ></div>
                                    </div>
                                    <div>
                                        <label htmlFor="rule-file-upload" className={`px-4 py-2 border rounded-lg font-semibold flex items-center gap-2 cursor-pointer w-max ${darkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"}`}>
                                            Attach document
                                        </label>
                                        <input id="rule-file-upload" type="file" onChange={(e) => setFormData(prev => ({ ...prev, event_rules_file: e.target.files[0] }))} className="hidden" accept=".pdf,.doc,.docx" />
                                        {formData.event_rules_file && ( <span className={`ml-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{formData.event_rules_file.name}</span> )}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prohibited items</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Add items that are not allowed for this event</p>
                                    <button type="button" onClick={() => setIsProhibitedModalOpen(true)} className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center gap-2">
                                        Add Prohibited Items
                                    </button>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {formData.prohibited_items.map((item) => (
                                            <div key={item} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${darkMode ? "bg-[#2B2B2B] text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                                                <span>{item}</span>
                                                <button type="button" onClick={() => removeProhibitedItem(item)} className={`${darkMode ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"}`}>
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event description <span className="text-red-400">*</span></h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Describe your event.</p>
                                    <div className={`mt-4 bg-transparent border rounded-lg ${darkMode ? "border-[#4A4A4A]" : "border-gray-300"}`}>
                                        <div className={`p-2 border-b ${darkMode ? "border-[#4A4A4A]" : "border-gray-300"} flex items-center space-x-1`}>
                                            <button type="button" onClick={() => handleFormat("bold", descriptionEditorRef)} className={`w-8 h-8 flex items-center justify-center rounded font-bold ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>B</button>
                                            <button type="button" onClick={() => handleFormat("italic", descriptionEditorRef)} className={`w-8 h-8 flex items-center justify-center rounded italic ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>I</button>
                                            <button type="button" onClick={() => handleFormat("underline", descriptionEditorRef)} className={`w-8 h-8 flex items-center justify-center rounded underline ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>U</button>
                                        </div>
                                        <div ref={descriptionEditorRef} contentEditable="true"
                                            className="w-full min-h-[120px] p-3 focus:outline-none"
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* --- POC & MEDIA SECTION --- */}
                             <div className="space-y-12">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Point of Contact</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Add POCs with whom event feedback will be shared.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                        <input name="POC_name" value={poc.POC_name} onChange={handlePocChange} placeholder="Enter the name of person"
                                            className={`w-full px-4 py-3 bg-transparent border rounded-lg ${darkMode ? "text-white border-[#4A4A4A]" : "text-black border-gray-300"}`} />
                                        <input name="POC_email" value={poc.POC_email} onChange={handlePocChange} type="email" placeholder="Enter the email id"
                                            className={`w-full px-4 py-3 bg-transparent border rounded-lg ${darkMode ? "text-white border-[#4A4A4A]" : "text-black border-gray-300"}`} />
                                    </div>
                                    <div className="mt-8">
                                        <input name="POC_contact" value={poc.POC_contact} onChange={handlePocChange} type="tel" placeholder="Enter contact number"
                                            className={`w-full px-4 py-3 bg-transparent border rounded-lg ${darkMode ? "text-white border-[#4A4A4A]" : "text-black border-gray-300"}`} />
                                    </div>
                                    <button type="button" onClick={handleAddPoc} className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white">Add +</button>

                                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {formData.POCS.map((pocItem, index) => (
                                            <div key={index} className="rounded-lg p-3 flex items-center justify-between bg-gray-100 dark:bg-[#2B2B2B]">
                                                <div className="truncate">
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{pocItem.POC_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{pocItem.POC_email} | {pocItem.POC_contact}</p>
                                                </div>
                                                <button type="button" onClick={() => handleRemovePoc(index)} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2" aria-label="Remove Point of Contact">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event Media</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <FileInput id="event_banner" label="Event Banner" info="Required. 2:1 ratio recommended." preview={previews.event_banner} onFileChange={handleMediaFileChange} onRemove={removeMediaFile} darkMode={darkMode} />
                                        <FileInput id="event_logo" label="Event or Organisation Logo" info="Optional. 1:1 ratio recommended." preview={previews.event_logo} onFileChange={handleMediaFileChange} onRemove={removeMediaFile} darkMode={darkMode} />
                                        <div>
                                            <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Images and videos</label>
                                            <div className={`relative rounded-lg text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[180px] flex justify-center items-center border-2 border-dashed ${formData.event_images.length > 0 ? "border-indigo-500" : "border-gray-300 dark:border-gray-600"} overflow-hidden`}>
                                                {formData.event_images.length > 0 ? (
                                                    <>
                                                        <img src={URL.createObjectURL(formData.event_images[0])} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                        <button type="button" onClick={handleRemoveLastImage} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center z-10">&times;</button>
                                                        
                                                        {formData.event_images.length < 10 && (
                                                            <label htmlFor="multi-media-upload" className="absolute top-1/2 -translate-y-1/2 right-2 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition z-10" title="Add another image">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                            </label>
                                                        )}

                                                        {formData.event_images.length > 1 && (
                                                            <div
                                                                onClick={() => setShowExtraMedia(!showExtraMedia)}
                                                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-4xl font-bold cursor-pointer"
                                                            >
                                                                +{formData.event_images.length - 1}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <label htmlFor="multi-media-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                        <span className="text-indigo-500 dark:text-indigo-400 font-semibold">Click to browse</span>
                                                    </label>
                                                )}
                                                <input id="multi-media-upload" type="file" multiple className="sr-only" onChange={handleMultiMediaChange} accept="image/*,video/*" />
                                            </div>
                                        </div>
                                    </div>
                                    {showExtraMedia && formData.event_images.length > 1 && (
                                        <div className="animate-fade-in">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Additional Media</p>
                                            <div className="flex overflow-x-auto space-x-4 p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                                                {formData.event_images.slice(1).map((file, index) => (
                                                    <div key={index} className="flex-shrink-0">
                                                        <img 
                                                            src={URL.createObjectURL(file)} 
                                                            alt={`Extra media ${index + 1}`}
                                                            className="h-24 w-auto aspect-video object-cover rounded-md"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                           {/* --- PAYMENT AND TICKETING --- */}
                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Type</h2>
                                    <div className="flex items-center space-x-6">
                                        <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300"><input type="radio" name="payment_type" value="free" checked={formData.payment_type === 'free'} onChange={handleInputChange} className="hidden peer" /><span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500"></span><span className="ml-2">Free</span></label>
                                        <label className="flex items-center cursor-pointer text-gray-600 dark:text-gray-300"><input type="radio" name="payment_type" value="paid" checked={formData.payment_type === 'paid'} onChange={handleInputChange} className="hidden peer" /><span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#4A4A4A] peer-checked:border-indigo-500 peer-checked:bg-indigo-500"></span><span className="ml-2">Paid</span></label>
                                    </div>
                                </div>
                                
                                {/* FIX: Entire paid section is now conditional */}
                              {formData.payment_type === 'paid'&& renderBankingSection() && (
                                <div className='space-y-12 animate-fade-in'>
                                    <section className="bg-white dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 shadow-sm dark:shadow-none">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <label className={`font-medium text-md ${groupHasBankAccount && !groupBankDetailsIncomplete ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    Do you want to use the bank account used for group creation?
                                                </label>
                                                {groupHasBankAccount && groupBankDetails && !groupBankDetailsIncomplete && (
                                                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                                            ✓ Group Bank Account Available
                                                        </p>
                                                        <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                                                            <p><strong>Holder:</strong> {groupBankDetails.bank_acc_holder}</p>
                                                            <p><strong>Type:</strong> {groupBankDetails.bank_acc_type?.toUpperCase()} Account</p>
                                                            <p><strong>Account:</strong> ****{groupBankDetails.bank_acc_no?.slice(-4)}</p>
                                                            <p><strong>IFSC:</strong> {groupBankDetails.bank_ifsc}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {!groupHasBankAccount && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        No bank account found for this group.
                                                    </p>
                                                )}
                                                {groupBankDetailsIncomplete && (
                                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                                        Group bank account details are incomplete. Please update your group profile.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <ToggleSwitch
                                                    checked={useGroupBankAccount}
                                                    onChange={handleUseGroupBankAccountToggle}
                                                    disabled={!groupHasBankAccount || groupBankDetailsIncomplete}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Banking details</h2>
                                            {!useGroupBankAccount && (
                                                <span className="px-3 py-1 bg-yellow-100 dark:bg-[#282115] text-yellow-800 dark:text-[#FFB800] text-xs font-medium rounded-md">
                                                    Bank account must be a current account or merchant account
                                                </span>
                                            )}
                                            {useGroupBankAccount && (
                                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-medium rounded-md">
                                                    Using group bank account
                                                </span>
                                            )}
                                        </div>
                                        
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            {useGroupBankAccount && groupBankDetails 
                                                ? "Using the primary bank account associated with your group." 
                                                : "Provide bank account details for payment processing, settlements, or refunds."
                                            }
                                        </p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                                            <div>
                                                <label htmlFor="bank_acc_type" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Account type <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select 
                                                        id="bank_acc_type" 
                                                        name="bank_acc_type" 
                                                        value={getCurrentBankDetail().bank_acc_type || ''} 
                                                        onChange={(e) => handleBankingDetailChange(0, e)} 
                                                        disabled={useGroupBankAccount}
                                                        className="w-full appearance-none bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="">Select account type</option>
                                                        <option value="current">Current</option>
                                                        <option value="merchant">Merchant</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="bank_acc_holder" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Account holder name <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    id="bank_acc_holder" 
                                                    name="bank_acc_holder" 
                                                    value={getCurrentBankDetail().bank_acc_holder || ''} 
                                                    onChange={(e) => handleBankingDetailChange(0, e)} 
                                                    disabled={useGroupBankAccount}
                                                    placeholder="eg. John Doe" 
                                                    className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="bank_acc_no" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    Account number <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    id="bank_acc_no" 
                                                    name="bank_acc_no" 
                                                    value={getCurrentBankDetail().bank_acc_no || ''} 
                                                    onChange={(e) => handleBankingDetailChange(0, e)} 
                                                    disabled={useGroupBankAccount}
                                                    placeholder="xxxx-xxxx-xxxx-xxxx" 
                                                    className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="bank_ifsc" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                    IFSC code <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    id="bank_ifsc" 
                                                    name="bank_ifsc" 
                                                    value={getCurrentBankDetail().bank_ifsc || ''} 
                                                    onChange={(e) => handleBankingDetailChange(0, e)} 
                                                    disabled={useGroupBankAccount}
                                                    placeholder="xxxxxxxxxxx" 
                                                    className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                    <section className="space-y-6 animate-fade-in">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ticketing details</h2>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Add ticket types, set prices, and control how attendees book their spot.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                                                <div><label htmlFor="booking_start_date" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Booking start date? <span className="text-red-500 ml-1">*</span></label><div className="relative"><input type="date" id="booking_start_date" name="booking_start_date" value={formData.booking_start_date} onChange={handleInputChange} className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 appearance-none"/><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div></div></div>
                                                <div><label htmlFor="booking_end_date" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Booking end date? <span className="text-red-500 ml-1">*</span></label><div className="relative"><input type="date" id="booking_end_date" name="booking_end_date" value={formData.booking_end_date} onChange={handleInputChange} className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 appearance-none"/><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div></div></div>
                                            </div>
                                            <button type="button" onClick={() => { setEditingTicket(null); setIsTicketModalOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-indigo-700 transition"><span>Add tickets</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" /></svg></button>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                                                {formData.ticket_types.map(ticket => (
                                                    <div key={ticket.id} className="bg-white dark:bg-[#2B2B2B] p-3 rounded-lg flex items-center justify-between shadow-sm dark:shadow-none">
                                                        <div className="flex items-center space-x-3"><img src={ticket.image} alt={ticket.name} className="w-16 h-16 rounded-md object-cover" /><div><p className="font-semibold text-gray-900 dark:text-white">{`${ticket.name} - ₹${Number(ticket.price).toLocaleString()}`}</p><p className="text-xs text-gray-500 dark:text-gray-400">Capacity: {ticket.capacity}</p></div></div>
                                                        <div className="flex items-center space-x-2">
                                                            <button type="button" onClick={() => {setEditingTicket(ticket); setIsTicketModalOpen(true);}} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg></button>
                                                            <button type="button" onClick={() => handleDeleteTicket(ticket.id)} className="text-gray-400 hover:text-red-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    {/* Rest of the paid section content */}
                                </div>
                            )}
                                
                                {/* FIX: Seating details now only shows for offline events */}
                                {formData.location_type === 'offline' && (
                                    <section className="space-y-6 max-w-2xl animate-fade-in">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Seating details</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Add event seating capacity and its layout</p>
                                        <div><label htmlFor="total_capacity" className="flex items-center text-base font-medium text-gray-800 dark:text-gray-300 mb-2">Maximum number of people allowed(capacity)? <span className="text-red-500 ml-1">*</span> <InfoTooltip note="Set the total number of attendees for your event." /></label><input type="number" id="total_capacity" name="total_capacity" value={formData.total_capacity} onChange={handleInputChange} placeholder="event capacity" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3" /></div>
                                        <div className="flex items-center justify-between"><label className="font-medium text-gray-900 dark:text-white text-md">Do you have seating layout?</label><ToggleSwitch checked={hasSeatingLayout} onChange={() => setHasSeatingLayout(!hasSeatingLayout)} /></div>
                                        {hasSeatingLayout && (<div className="animate-fade-in grid grid-cols-2 gap-8 items-start"><div className="col-span-1 space-y-2"><label className="flex items-center text-base font-medium text-gray-800 dark:text-gray-300">Upload seating layout <InfoTooltip note="Upload an image of your event's seating arrangement." /></label><div className="flex justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center"><label htmlFor="seating-layout-upload" className="cursor-pointer"><svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg><p className="text-sm text-gray-500 dark:text-gray-400">Drag your file(s) or browse</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max 10 MB files are allowed</p><span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">Browse file</span><input id="seating-layout-upload" type="file" className="sr-only" onChange={(e) => handleMediaFileChange(e, 'ticket_layout')} accept="image/*" /></label></div></div><div className="col-span-1">{previews.ticket_layout && ( <div className="relative group w-full"><img src={previews.ticket_layout} alt="Seating layout preview" className="w-full h-auto rounded-lg object-cover" /><div onClick={() => removeMediaFile('ticket_layout')} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer rounded-lg"><span className="text-red-500 text-3xl font-bold">&times;</span></div></div> )}</div></div>)}
                                    </section>
                                )}
                            </div>

                            {/* --- FINAL ACTION BUTTONS --- */}
                                <button type="button" onClick={handleSaveAndAddMore}
                                    disabled={isSubmitting}className="w-full py-3 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors duration-200">
                                    {isSubmitting 
                                        ? 'Saving...' 
                                        : isEditingSubEvent 
                                            ? 'Save changes & add new event +' 
                                            : 'Add more sub events +'
                                    }
                                </button>
                                <div className="pt-8 flex justify-between items-center">
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => navigate(`/ticket/update-ticket-media/${ticketId}`)} className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
                                            Go back
                                        </button>
                                        <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-wait">
                                            {isSubmitting ? "Saving..." : "Save and continue"}
                                        </button>
                                    </div>
                                </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
        </>
    );
};
export default UpdateTicketAddOns;
