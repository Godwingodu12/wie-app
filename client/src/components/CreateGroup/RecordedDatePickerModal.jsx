import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
} from "date-fns";
import Date_Form_Icon from "../../assets/Event/Date_Form_Icon.svg?react";

// Helper Icons
const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);
const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);
const LinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);
const AttachmentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);

const RecoredDatePickerModal = ({
  isOpen,
  onClose,
  onSave,
  initialDates,
  darkMode,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [configuredGroups, setConfiguredGroups] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [videoLink, setVideoLink] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoName, setVideoName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [dateType, setDateType] = useState("one-day"); 

  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Convert the flat 'initialDates' from the parent into the 'group' structure for editing
      const groups = (initialDates || []).reduce((acc, date) => {
        const key = `${date.videoName || ""}-${date.videoLink || ""}`;
        if (!acc[key]) {
          acc[key] = {
            id: Date.now() + Math.random(),
            dates: [],
            videoLink: date.videoLink,
            videoFile: date.videoFile,
            videoName: date.videoName,
            verificationCode: date.verificationCode,
            previewImage: date.previewImage,
          };
        }
        acc[key].dates.push(date.date);
        return acc;
      }, {});
      setConfiguredGroups(Object.values(groups));
      resetFormAndSelection();
    }
  }, [isOpen, initialDates]);

  const resetFormAndSelection = () => {
    setCurrentSelection([]);
    setEditingId(null);
    setVideoLink("");
    setVideoFile(null);
    setVideoName("");
    setVerificationCode("");
    setPreviewImage(null);
    if (videoInputRef.current) videoInputRef.current.value = null;
    if (imageInputRef.current) imageInputRef.current.value = null;
  };

  const handleDateTypeChange = (type) => {
    setSelectedDates([]);
    const typeMap = {
      "Single day": "one-day",
      "Multi days": "multi-day",
      "Weekly": "weekly"
    };
    setDateType(typeMap[type] || type);
  };

  const handleDateClick = (dateStr) => {
    const existingGroup = configuredGroups.find((g) =>
      g.dates.includes(dateStr)
    );
    if (editingId) {
      if (existingGroup && existingGroup.id === editingId) {
        setCurrentSelection((prev) =>
          prev.includes(dateStr)
            ? prev.filter((d) => d !== dateStr)
            : [...prev, dateStr]
        );
      } else {
        resetFormAndSelection();
        if (existingGroup) handleEdit(existingGroup.id);
        else setCurrentSelection([dateStr]);
      }
    } else {
      if (existingGroup) handleEdit(existingGroup.id);
      else
        setCurrentSelection((prev) =>
          prev.includes(dateStr)
            ? prev.filter((d) => d !== dateStr)
            : [...prev, dateStr]
        );
    }
  };

  const handleAddOrUpdate = () => {
    if (currentSelection.length === 0) {
      alert("Please select at least one date.");
      return;
    }
    if (!videoName.trim()) {
      alert("Video name is required.");
      return;
    }
    if (!videoLink.trim() && !videoFile) {
      alert("Either a Video Link or an attached video file is required.");
      return;
    }

    const newDetails = {
      videoLink,
      videoFile,
      videoName,
      verificationCode,
      previewImage,
    };

    if (editingId) {
      setConfiguredGroups((prev) =>
        prev.map((group) =>
          group.id === editingId
            ? { ...group, dates: currentSelection.sort(), ...newDetails }
            : group
        )
      );
    } else {
      setConfiguredGroups((prev) => [
        ...prev,
        {
          id: Date.now(),
          dates: currentSelection.sort(),
          ...newDetails,
        },
      ]);
    }
    resetFormAndSelection();
  };

  const handleEdit = (groupId) => {
    const groupToEdit = configuredGroups.find((g) => g.id === groupId);
    if (groupToEdit) {
      setEditingId(groupToEdit.id);
      setCurrentSelection(groupToEdit.dates);
      setVideoLink(groupToEdit.videoLink || "");
      setVideoFile(groupToEdit.videoFile || null);
      setVideoName(groupToEdit.videoName || "");
      setVerificationCode(groupToEdit.verificationCode || "");
      setPreviewImage(groupToEdit.previewImage || null);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to remove all configured dates? This action cannot be undone."
      )
    ) {
      setConfiguredGroups([]);
      resetFormAndSelection();
    }
  };

const handleSaveChanges = () => {
  const flattenedDates = configuredGroups.flatMap((group) => {
    return (group.dates || []).map((dateStr) => ({
      date: dateStr,
      endDate: dateStr,
      videoLink: group.videoLink,
      videoName: group.videoName,
      verificationCode: group.verificationCode,
      videoFile: group.videoFile,
      previewImage: group.previewImage,
      startTime: "",
      endTime: "",
    }));
  });
  // Use dateType instead of hardcoded "recorded"
  onSave(flattenedDates, dateType);
  onClose();
};

  const removeDateFromSelection = (dateToRemove) => {
    setCurrentSelection((prev) => prev.filter((d) => d !== dateToRemove));
  };

  const allConfiguredDates = useMemo(
    () => configuredGroups.flatMap((g) => g.dates || []),
    [configuredGroups]
  );

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const days = eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }),
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const isSelected = currentSelection.includes(dateStr);
      const isConfigured = allConfiguredDates.includes(dateStr);
      const isCurrentMonthDay = isSameMonth(day, currentMonth);
      const isToday = isSameDay(day, today);
      const isPast = day < today;

      let dayClasses = `flex items-center justify-center h-10 w-10 rounded-full transition-colors text-sm `;

      if (isPast || !isCurrentMonthDay) {
        dayClasses += darkMode ? "text-gray-700" : "text-gray-300";
        dayClasses += " cursor-not-allowed";
      } else {
        dayClasses += "cursor-pointer ";
        if (isSelected || isConfigured) {
          dayClasses += "bg-emerald-500 text-white font-bold";
        } else {
          dayClasses += darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";
        }
        if (isToday && !isSelected && !isConfigured) {
          dayClasses += " border border-emerald-500";
        }
      }

      return (
        <div
          key={index}
          onClick={() =>
            !isPast && isCurrentMonthDay && handleDateClick(dateStr)
          }
          className={dayClasses}
        >
          {format(day, "d")}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-4xl flex flex-col ${
          darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"
        }`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            darkMode ? "border-gray-700" : "border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <img
                src={Date_Form_Icon}
                alt=""
                className={`w-5 h-5 ${
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                }`}
              />
            </div>
            <div>
              <h3
                className={`font-bold text-lg ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                Recorded Event Scheduler
              </h3>
            </div>
          </div>
          <div>
            
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
            &times;
          </button>
        </div>

        <div className="flex flex-1 h-[70vh]">
          <div
            className={`w-2/5 p-4 border-r items-center ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className={`p-2 rounded-full ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <ChevronLeftIcon />
              </button>
              <span className="font-semibold text-lg">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className={`p-2 rounded-full ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <ChevronRightIcon />
              </button>
            </div>
            <div
              className={`grid grid-cols-7 text-center text-xs mb-2 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={index}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">
              {generateCalendarDays()}
            </div>
          </div>

          <div className="w-3/5 p-6 flex flex-col space-y-4">
            <div
              className={`flex-shrink-0 flex items-center gap-2 flex-wrap h-[50px] overflow-y-auto custom-scrollbar border-b pb-2 pr-2 ${
                darkMode ? "border-gray-700" : "border-gray-300"
              }`}
            >
              {editingId &&
                currentSelection.map((date) => (
                  <span
                    key={date}
                    className="bg-orange-500 text-white pl-3 pr-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  >
                    {format(new Date(date.replace(/-/g, "/")), "dd/MM/yyyy")}
                    <button
                      type="button"
                      onClick={() => removeDateFromSelection(date)}
                      className="bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              {!editingId &&
                currentSelection.map((date) => (
                  <span
                    key={date}
                    className={`pl-3 pr-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      darkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {format(new Date(date.replace(/-/g, "/")), "dd/MM/yyyy")}
                    <button
                      type="button"
                      onClick={() => removeDateFromSelection(date)}
                      className={`rounded-full w-4 h-4 flex items-center justify-center text-xs ${
                        darkMode
                          ? "bg-gray-500/50 hover:bg-red-500"
                          : "bg-gray-300 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              {configuredGroups
                .filter((g) => g.id !== editingId)
                .flatMap((group) =>
                  (group.dates || []).map((date) => (
                    <button
                      key={`${group.id}-${date}`}
                      onClick={() => handleEdit(group.id)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-emerald-700"
                    >
                      {format(new Date(date.replace(/-/g, "/")), "dd/MM/yyyy")}
                    </button>
                  ))
                )}
              {currentSelection.length === 0 &&
                configuredGroups.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Select dates from the calendar...
                  </p>
                )}
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
<div className="flex items-end gap-4">
                                <div className="relative flex-grow">
                                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Video link <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="Recorded event video link" value={videoLink} onChange={e => setVideoLink(e.target.value)} className={`w-full mt-1 p-3 pl-10 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300 text-black'}`} />
                                    <div className="absolute left-3 top-10"><LinkIcon /></div>
                                </div>

                                <span className="text-gray-500 text-sm pb-3">OR</span>

                                <div>
                                    <button type="button" onClick={() => videoInputRef.current.click()} className={`p-3 rounded-lg flex items-center justify-center font-semibold whitespace-nowrap ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                        <AttachmentIcon/> Attach video
                                    </button>
                                    <input type="file" ref={videoInputRef} onChange={e => setVideoFile(e.target.files[0])} className="hidden" accept="video/*"/>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Video name <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="E.g. Chapter 1" value={videoName} onChange={e => setVideoName(e.target.value)} className={`w-full mt-1 p-3 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300 text-black'}`} />
                                </div>
                                <div>
                                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Verification code (Optional)</label>
                                    <input type="text" placeholder="Add a verification code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className={`w-full mt-1 p-3 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300 text-black'}`} />
                                </div>
                            </div>
              <button
                type="button"
                onClick={() => imageInputRef.current.click()}
                className={`w-full p-3 rounded-lg flex items-center justify-center font-semibold ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                <AttachmentIcon />{" "}
                {previewImage ? previewImage.name : "Video preview image"}
              </button>
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => setPreviewImage(e.target.files[0])}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="flex-shrink-0 pt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={handleAddOrUpdate}
                className={`flex-grow py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  editingId
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                disabled={currentSelection.length === 0}
              >
                {editingId ? "Update Date Group" : "Add Date Group"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetFormAndSelection}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className={`border-t ${
            darkMode ? "border-gray-700" : "border-gray-300"
          }`}
        ></div>
        <div className="flex justify-end items-center p-4 space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className={`px-6 py-2 rounded-lg font-semibold ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoredDatePickerModal;
