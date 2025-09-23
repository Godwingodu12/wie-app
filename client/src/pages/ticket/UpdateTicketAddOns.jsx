import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// --- IMPORTANT: Make sure getGroupView is in your ticketService.js file ---
import { updateTicketAddOns, getTicketById, getGroupView } from '../../services/ticketService';
import { format } from "date-fns";
import EventSidebar from "../../components/CreateGroup/EventSidebar";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";

// --- Reusable UI Components (No changes) ---
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
                {tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(tag)} className="text-indigo-400 dark:text-indigo-300 hover:text-indigo-600 dark:hover:text-white font-bold">
                            ×
                        </button>
                    </div>
                ))}
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder}
                    className={`flex-1 bg-transparent focus:outline-none p-1 ${darkMode ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`} />
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
  const [dateType, setDateType] = useState("Multi days");
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
          }
        : { startTime: "10:00", endTime: "18:00" };

    switch (dateType) {
      case "Single day": {
        const isSelected = selectedDates.some((d) => d.date === dateStr);
        setSelectedDates(isSelected ? [] : [{ date: dateStr, ...commonTime }]);
        break;
      }
      case "Multi days": {
        const isSelected = selectedDates.some((d) => d.date === dateStr);
        let newDates;
        if (isSelected) {
          newDates = selectedDates.filter((d) => d.date !== dateStr);
        } else {
          newDates = [...selectedDates, { date: dateStr, ...commonTime }];
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
            datesForDayOfWeek.push({
              date: format(date, "yyyy-MM-dd"),
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
      setSelectedDates((currentDates) =>
        currentDates.map((d) => ({ ...d, [field]: value }))
      );
    } else {
      const updatedDates = [...selectedDates];
      updatedDates[index][field] = value;
      setSelectedDates(updatedDates);
    }
  };

  const handleSave = () => {
    onSave(selectedDates, dateType);
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
                  onChange={(e) => setUseSameTime(e.target.checked)}
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
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) =>
                        handleIndividualTimeChange(
                          index,
                          "startTime",
                          e.target.value
                        )
                      }
                      className={`border rounded-lg p-2 text-sm w-full ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-black"
                      }`}
                    />
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) =>
                        handleIndividualTimeChange(
                          index,
                          "endTime",
                          e.target.value
                        )
                      }
                      className={`border rounded-lg p-2 text-sm w-full ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-black"
                      }`}
                    />
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
                <div className="p-6 flex justify-between items-center flex-shrink-0"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">{currentEditId ? 'Edit Ticket' : 'Create Ticket'}</h2><button onClick={onClose} className="text-gray-400 text-3xl hover:text-gray-800 dark:hover:text-white transition">&times;</button></div>
                <hr className="border-gray-200 dark:border-gray-700"/>
                <div className="flex-grow flex p-6 gap-6 overflow-hidden">
                    <div className="w-1/2 space-y-5 flex flex-col"><input type="text" value={ticketType} onChange={e => setTicketType(e.target.value)} placeholder="e.g. VIP, General Admission" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3" />
                        <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ticket price</label><div className="flex items-center bg-gray-100 dark:bg-[#1c1c1f] border border-gray-300 dark:border-gray-700 rounded-md"><span className="text-gray-500 dark:text-gray-400 pl-3">INR</span><input type="number" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} placeholder="Ticket price" className="w-full bg-transparent p-3 text-gray-900 dark:text-white"/></div></div>
                        <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total tickets</label><input type="number" value={totalTickets} onChange={e => setTotalTickets(e.target.value)} placeholder="Total tickets available" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3"/></div>
                        <div className="flex-grow flex flex-col"><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Upload ticket photo</label><div className="flex-grow mt-2 flex justify-center items-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center"><label htmlFor="ticket-photo-upload" className="cursor-pointer"><svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">browse your files</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max 10 MB files are allowed</p><span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">Browse file</span><input id="ticket-photo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" /></label></div></div>
                        <div className="pt-2 flex-shrink-0">
                            <button onClick={handleAddOrUpdateTicket} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition w-full">{currentEditId ? 'Update Ticket' : '+ Add Ticket'}</button>
                        </div>
                    </div>
                    <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                    <div className="w-1/2 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {localTickets.length === 0 ? (
                             <div className="text-center text-gray-500 pt-16">No tickets added yet.</div>
                        ) : (
                            localTickets.map(ticket => (
                                <div key={ticket.id} className="bg-gray-100 dark:bg-[#363A3F] p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center space-x-3"><img src={ticket.image} alt={ticket.name} className="w-16 h-16 rounded-md object-cover" /><div><p className="font-semibold text-gray-900 dark:text-white">{`${ticket.name} - ₹${Number(ticket.price).toLocaleString()}`}</p><p className="text-xs text-gray-500 dark:text-gray-400">Capacity: {ticket.capacity}</p></div></div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => startEditing(ticket)} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg></button>
                                        <button onClick={() => handleDeleteTicket(ticket.id)} className="text-gray-400 hover:text-red-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <hr className="border-gray-200 dark:border-gray-700"/>
                <div className="p-6 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={handleResetAll} className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition">Reset all</button>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">Save Changes</button>
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
        banking_details: [{ bank_acc_type: '', bank_acc_holder: '', bank_acc_no: '', bank_ifsc: '' }],
        booking_start_date: '',
        booking_end_date: '',
        ticket_types: [],
        total_capacity: '',
        ticket_layout: null, 
        event_banner: null,
        event_logo: null,
        event_images: [],
    };
    const [formData, setFormData] = useState(initialFormState);
    const [previews, setPreviews] = useState({
        ticket_layout: null,
        event_banner: null,
        event_logo: null,
    });
    
    // FIX: Refined useEffect to fetch all necessary data on load
const fetchData = async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const ticketData = await getTicketById(ticketId);
            setExistingSubEvents(ticketData?.ticket?.sub_events || []);

            const groupData = await getGroupView(ticketId);
            const bankInfo = groupData?.group?.banking_details?.[0];

            if (bankInfo) {
                setGroupBankDetails(bankInfo);
                if (bankInfo.bank_acc_holder && bankInfo.bank_acc_no && bankInfo.bank_ifsc && bankInfo.bank_acc_type) {
                    setGroupHasBankAccount(true);
                    setGroupBankDetailsIncomplete(false);
                } else {
                    setGroupHasBankAccount(true);
                    setGroupBankDetailsIncomplete(true);
                }
            } else {
                setGroupHasBankAccount(false);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            alert("Could not load event data. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [ticketId]);
    
    const resetForm = () => {
        setFormData(initialFormState);
        setPreviews({ ticket_layout: null, event_banner: null, event_logo: null });
        if (rulesEditorRef.current) rulesEditorRef.current.innerHTML = '';
        if (descriptionEditorRef.current) descriptionEditorRef.current.innerHTML = '';
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
        const list = [...formData.banking_details];
        list[index][name] = value;
        setFormData(prev => ({...prev, banking_details: list}));
    };
    
    // FIX: This is the fully functional submit handler
const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const submissionForm = new FormData();

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
            event_date_type: formData.event_date_type,
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
            resetForm(); // Reset form for the next entry
            fetchData(); // Refresh the list to show the new event
        } catch (error) {
            console.error("Error submitting form:", error.response ? error.response.data : error);
            alert(`Submission failed: ${error.response?.data?.message || 'An error occurred.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const currentBankDetail = formData.banking_details[0] || {};
    
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
                    handleBack={() => navigate(`/ticket/update-ticket-details/${ticketId}`)}
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
                        
                        <div className="mb-12">
                            <h2 className="text-xl font-semibold mb-4">Your Existing Events</h2>
                             {loading ? <p>Loading events...</p> : (
                                existingSubEvents.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {existingSubEvents.map((event, index) => (
                                            <div key={index} className="bg-gray-100 dark:bg-[#2B2B2B] rounded-lg overflow-hidden shadow-md">
                                                <img src={event.event_banner} alt={event.event_name} className="w-full h-32 object-cover" />
                                                <div className="p-4">
                                                    <h3 className="font-semibold truncate">{event.event_name}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{event.event_category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No sub-events have been added yet.</p>
                                )
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
                                                <label htmlFor="location" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Event location<span className="text-red-400">*</span></label>
                                                <input id="location" name="location" type="text" value={formData.location} onChange={handleInputChange} placeholder="Search for location..."
                                                    className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50" />
                                            </div>
                                            <div>
                                                <label htmlFor="venue" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Event venue<span className="text-red-400">*</span></label>
                                                <input id="venue" name="venue" type="text" value={formData.venue} onChange={handleInputChange} placeholder="Enter the event venue"
                                                    className="w-full px-4 py-3 bg-transparent border rounded-lg text-gray-800 dark:text-white border-gray-300 dark:border-[#4A4A4A] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50" />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Exact map location (Optional)</label>
                                            <div className="w-full h-64 rounded-lg border bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-[#4A4A4A]">
                                               {/* MAP INTEGRATION CAN GO HERE */}
                                            </div>
                                        </div>
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
                                                {formData.event_dates.map((item) => (
                                                    <div key={item.date} className="bg-gray-100 dark:bg-[#2B2B2B] rounded-lg p-3 text-center text-sm font-semibold relative">
                                                        {new Date(item.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                        <button onClick={() => removeDate(item.date)} type="button" className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">&times;</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {formData.location_type === 'offline' && (
                                        <div className="animate-fade-in pt-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="font-medium text-gray-900 dark:text-white text-md">Does the gates open before event starting time?</label>
                                                <ToggleSwitch
                                                    checked={formData.gatesOpenEarly}
                                                    onChange={() => handleToggleChange("gatesOpenEarly")}
                                                />
                                            </div>
                                            {formData.gatesOpenEarly && (
                                                <div>
                                                    <label htmlFor="gate_open_time" className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                        Time of gate opening?<span className="text-red-400">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input id="gate_open_time" name="gate_open_time" type="time" value={formData.gate_open_time} onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 ${darkMode ? "border-[#4A4A4A] text-white" : "border-gray-300 text-black"}`}
                                                        />
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
                                {formData.payment_type === 'paid' && (
                                    <div className='space-y-12 animate-fade-in'>
                                        <section className="bg-white dark:bg-[#2B2B2B] p-8 rounded-lg space-y-6 shadow-sm dark:shadow-none">
                                            <div className="flex items-center justify-between">
                                                <label className={`font-medium text-md ${groupHasBankAccount ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                    Do you want to use the bank account used for group creation?
                                                </label>
                                                <ToggleSwitch
                                                    checked={useGroupBankAccount}
                                                    onChange={() => setUseGroupBankAccount(!useGroupBankAccount)}
                                                    disabled={!groupHasBankAccount || groupBankDetailsIncomplete}
                                                />
                                            </div>
                                            {groupBankDetailsIncomplete && (
                                                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                                                    This option is disabled because your group's primary bank account details are incomplete. Please update your group profile to use this feature.
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-4"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Banking details</h2>{!useGroupBankAccount && <span className="px-3 py-1 bg-yellow-100 dark:bg-[#282115] text-yellow-800 dark:text-[#FFB800] text-xs font-medium rounded-md">Bank account must be a current account or merchant account</span>}</div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{useGroupBankAccount ? "This is the primary bank account associated with your group." : "Provide bank account details for payment processing, settlements, or refunds."}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                                                <div><label htmlFor="bank_acc_type" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Account type <span className="text-red-500 ml-1">*</span></label><div className="relative"><select id="bank_acc_type" name="bank_acc_type" value={currentBankDetail.bank_acc_type || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} className="w-full appearance-none bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"><option value="" className="bg-white dark:bg-gray-800">select account type</option><option value="current" className="bg-white dark:bg-gray-800">Current</option><option value="merchant" className="bg-white dark:bg-gray-800">Merchant</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div></div></div>
                                                <div><label htmlFor="bank_acc_holder" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Account holder name <span className="text-red-500 ml-1">*</span></label><input type="text" id="bank_acc_holder" name="bank_acc_holder" value={currentBankDetail.bank_acc_holder || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} placeholder="eg. John Doe" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"/></div>
                                                <div><label htmlFor="bank_acc_no" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Account number <span className="text-red-500 ml-1">*</span></label><input type="text" id="bank_acc_no" name="bank_acc_no" value={currentBankDetail.bank_acc_no || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} placeholder="xxxx-xxxx-xxxx-xxxx" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"/></div>
                                                <div><label htmlFor="bank_ifsc" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">IFSC code <span className="text-red-500 ml-1">*</span></label><input type="text" id="bank_ifsc" name="bank_ifsc" value={currentBankDetail.bank_ifsc || ''} onChange={(e) => handleBankingDetailChange(0, e)} disabled={useGroupBankAccount} placeholder="xxxxxxxxxxx" className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md p-3 disabled:opacity-50 disabled:cursor-not-allowed"/></div>
                                            </div>
                                        </section>
                                        
                                        {/* FIX: Ticketing section is now inside the PAID check */}
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
                                <div className="pt-8 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        + Add Another Event
                                    </button>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => navigate(`/ticket/update-ticket-details/${ticketId}`)} className="px-8 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
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