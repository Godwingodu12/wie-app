// src/components/DatePicker.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Alert from "../../components/CreateGroup/Alert.jsx";

// Helper to parse YYYY-MM-DD strings into local timezone Date objects
const parseDateString = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  if (dt.getMonth() !== parseInt(parts[1], 10) - 1) return null;
  return dt;
};

export default function DateInput({
  id, name, label, value, onChange, error, required, darkMode, minDate, maxDate,
}) {
  const initialDate = parseDateString(value);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [displayDate, setDisplayDate] = useState(initialDate || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState('bottom');
  const [view, setView] = useState('days');
  const datePickerRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- UPDATED: Default to today if minDate is not provided ---
  const minDateObj = parseDateString(minDate) || today;
  if (minDateObj) {
    minDateObj.setHours(0, 0, 0, 0);
  }

  const maxDateObj = parseDateString(maxDate);
  if (maxDateObj) {
    maxDateObj.setHours(23, 59, 59, 999);
  }

  useEffect(() => { setSelectedDate(parseDateString(value)); }, [value]);

  useEffect(() => {
    if (isOpen) {
      const inputRect = datePickerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - inputRect.bottom;
      const popupHeight = 350;
      setPopupPosition(spaceBelow < popupHeight && inputRect.top > popupHeight ? 'top' : 'bottom');
    } else {
      setView('days');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (day) => {
    const newSelectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    const year = newSelectedDate.getFullYear();
    const month = String(newSelectedDate.getMonth() + 1).padStart(2, '0');
    const date = String(newSelectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${date}`;

    onChange({ target: { id, name, value: formattedDate } });
    setIsOpen(false);
  };

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const handlePrev = () => {
    if (view === 'days') setDisplayDate(new Date(year, month - 1, 1));
    else if (view === 'months') setDisplayDate(new Date(year - 1, month, 1));
    else if (view === 'years') setDisplayDate(new Date(year - 10, month, 1));
  };
  const handleNext = () => {
    if (view === 'days') setDisplayDate(new Date(year, month + 1, 1));
    else if (view === 'months') setDisplayDate(new Date(year + 1, month, 1));
    else if (view === 'years') setDisplayDate(new Date(year + 10, month, 1));
  };

  const renderDays = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = new Date(year, month, 1).getDay();
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const calendarDays = Array.from({ length: startingDay }, (_, i) => <div key={`empty-${i}`}></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      currentDate.setHours(0, 0, 0, 0);
      const isSelected = selectedDate && currentDate.getTime() === selectedDate.getTime();
      const isToday = currentDate.getTime() === today.getTime();
      
      // The disabling logic now correctly uses the effective minDate
      const isPast = minDateObj ? currentDate < minDateObj : false;
      const isFuture = maxDateObj ? currentDate > maxDateObj : false;
      const isDisabled = isPast || isFuture;

      calendarDays.push(
        <div key={day} onClick={() => !isDisabled && handleDateSelect(day)}
          className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full transition-colors ${
            isDisabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' :
            `cursor-pointer ${isSelected ? 'bg-blue-600 text-white' : `hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${isToday ? 'border border-blue-600 dark:border-blue-400' : ''}`}`
          }`}
        >{day}</div>
      );
    }
    return (
      <>
        <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
          {daysOfWeek.map((day, index) => <div key={`weekday-${index}`}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 place-items-center">{calendarDays}</div>
      </>
    );
  };

  const renderMonths = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'short' }));
    return (
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, i) => (
          <button key={m} type="button" onClick={() => { setDisplayDate(new Date(year, i, 1)); setView('days'); }}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm sm:text-base"
          >{m}</button>
        ))}
      </div>
    );
  };

  const renderYears = () => {
    const startYear = Math.floor(year / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => startYear - 1 + i);
    return (
      <div className="grid grid-cols-4 gap-2">
        {years.map((y, i) => (
          <button key={y} type="button" onClick={() => { setDisplayDate(new Date(y, month, 1)); setView('months'); }}
            className={`p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 text-sm sm:text-base ${i === 0 || i === 11 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}
          >{y}</button>
        ))}
      </div>
    );
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'Select a date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className={`relative w-full max-w-xs font-sans ${darkMode ? 'dark' : ''}`} ref={datePickerRef}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>}
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-700 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
      >
        <span className="text-sm sm:text-base">{formatDisplayDate(selectedDate)}</span>
        <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className={`absolute w-full p-2 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700 ${popupPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
            <button type="button" onClick={() => view === 'days' ? setView('months') : view === 'months' ? setView('years') : null} className="font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 text-base sm:text-lg">
              {view === 'days' && displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              {view === 'months' && year}
              {view === 'years' && `${Math.floor(year / 10) * 10} - ${Math.floor(year / 10) * 10 + 9}`}
            </button>
            <button type="button" onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
          </div>
          {view === 'days' && renderDays()}
          {view === 'months' && renderMonths()}
          {view === 'years' && renderYears()}
        </div>
      )}
      <div className="mt-2">{error && <Alert message={error} />}</div>
    </div>
  );
};