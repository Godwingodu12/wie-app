import React, { useEffect, useState, useRef, useMemo } from "react";
import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth } from "date-fns";
import Date_Form_Icon  from "../../assets/Event/Date_Form_Icon.svg?react";
import ConfirmModal from "./ConfirmModal";

// Helper Icons
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const AttachmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;



const RecordedDatePickerModal = ({ isOpen, onClose, onSave, initialDates, darkMode ,showAlert,minDate,
  maxDate}) => {
    const [dateType, setDateType] = useState("one-day");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [configuredGroups, setConfiguredGroups] = useState([]);
    const [currentSelection, setCurrentSelection] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [videoLink, setVideoLink] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoName, setVideoName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false); 
    const videoInputRef = useRef(null);
    const imageInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            const groups = (initialDates || []).reduce((acc, date) => {
                const key = `${date.videoName || ""}-${date.videoLink || ""}`;
                if (key && !acc[key]) {
                    acc[key] = { id: Date.now() + Math.random(), dates: [], ...date };
                }
                if(key) acc[key].dates.push(date.date);
                return acc;
            }, {});
            setConfiguredGroups(Object.values(groups));
            resetFormAndSelection();
        }
    }, [isOpen, initialDates]);

    const resetFormAndSelection = () => {
        setCurrentSelection([]);
        setEditingId(null);
        setVideoLink(''); setVideoFile(null); setVideoName(''); setVerificationCode('');
        setPreviewImage(null);
        if (videoInputRef.current) videoInputRef.current.value = null;
        if (imageInputRef.current) imageInputRef.current.value = null;
    };


      const handleDateTypeChange = (type) => {
    setCurrentSelection([]);
    const typeMap = {
      "Single day": "one-day",
      "Multi days": "multi-day",
      "Weekly": "weekly"
    };
    setDateType(typeMap[type] || type);
  };
  

    const handleDateClick = (dateStr) => {
        // First, check if the date is in the current temporary selection
        if (currentSelection.includes(dateStr)) {
            setCurrentSelection(prev => prev.filter(d => d !== dateStr));
            return;
        }

        // Second, check if the date is part of an already configured group
        let wasRemovedFromGroup = false;
        const newConfiguredGroups = configuredGroups.map(group => {
            if ((group.dates || []).includes(dateStr)) {
                wasRemovedFromGroup = true;
                return { ...group, dates: group.dates.filter(d => d !== dateStr) };
            }
            return group;
        }).filter(group => (group.dates || []).length > 0);

        if (wasRemovedFromGroup) {
            setConfiguredGroups(newConfiguredGroups);
            if (editingId && !newConfiguredGroups.some(g => g.id === editingId)) {
                resetFormAndSelection();
            }
            return;
        }

        // Finally, if the date is new, add it to the current selection
        if (dateType === 'one-day') {
            setCurrentSelection([dateStr]);
        } else { // Multi days
            setCurrentSelection(prev => [...prev, dateStr].sort());
        }
    };

    const handleAddOrUpdate = () => {
        if (currentSelection.length === 0) {             showAlert({ type: 'error', message: 'No Date Selected', description: 'Please select at least one date from the calendar.' });
 return; }
        if (!videoName.trim()) {             showAlert({ type: 'error', message: 'Video Name Required', description: 'Please provide a name for the video.' });
 return; }
        if (!videoLink.trim() && !videoFile) {            showAlert({ type: 'error', message: 'Video Source Missing', description: 'Please provide either a video link or attach a video file.' });
 return; }

        const newDetails = { videoLink, videoFile, videoName, verificationCode, previewImage };

        if (editingId) {
            setConfiguredGroups(prev => prev.map(group => group.id === editingId ? { ...group, dates: currentSelection.sort(), ...newDetails } : group));
        } else {
            setConfiguredGroups(prev => [...prev, { id: Date.now(), dates: currentSelection.sort(), ...newDetails }]);
        }
        resetFormAndSelection();
    };

    const handleEdit = (groupId) => {
        const groupToEdit = configuredGroups.find(g => g.id === groupId);
        if (groupToEdit) {
            setEditingId(groupToEdit.id);
            setCurrentSelection(groupToEdit.dates);
            setVideoLink(groupToEdit.videoLink || '');
            setVideoFile(groupToEdit.videoFile || null);
            setVideoName(groupToEdit.videoName || '');
            setVerificationCode(groupToEdit.verificationCode || '');
            setPreviewImage(groupToEdit.previewImage || null);
        }
    };

    const handleReset = () => {
               setIsConfirmOpen(true);

    };
    const executeReset = () => {
        // This function contains the actual logic and is called on confirm
        setConfiguredGroups([]);
        resetFormAndSelection();
        setIsConfirmOpen(false); // Close the confirm modal
    };

const handleSaveChanges = () => {
    // Flatten all dates from the configured groups into a single array
    const flattenedDates = configuredGroups.flatMap(group => 
        (group.dates || []).map(dateStr => ({
            date: dateStr,
            endDate: dateStr, // For recorded, start and end are the same
            startTime: "",    // Recorded events don't have start/end times
            endTime: "",
            eventLink: group.videoLink || "", // Correctly use videoLink from the group
            videoName: group.videoName || "",
            verificationCode: group.verificationCode || "",
            videoFile: group.videoFile || null,
            previewImage: group.previewImage || null,
        }))
    );

    // Check if there's an unsaved selection in the form
    if (currentSelection.length > 0) {
        // Validate the unsaved selection before adding it
        if (!videoName.trim()) {
            showAlert({ type: 'error', message: 'Unsaved Changes', description: 'Please add your current selection to a date group before saving.' });
            return;
        }
        if (!videoLink.trim() && !videoFile) {
            showAlert({ type: 'error', message: 'Unsaved Changes', description: 'Your current selection is missing a video link or file. Please add it to a group.' });
            return;
        }
        // Add the currently selected (but not yet grouped) dates to the final list
        currentSelection.forEach(dateStr => {
            flattenedDates.push({
                date: dateStr,
                endDate: dateStr,
                startTime: "",
                endTime: "",
                eventLink: videoLink,
                videoName: videoName,
                verificationCode: verificationCode,
                videoFile: videoFile,
                previewImage: previewImage,
            });
        });
    }

    if (flattenedDates.length === 0) {
         showAlert({ type: 'error', message: 'No Dates Selected', description: 'Please select and configure at least one date.' });
         return;
    }

    onSave(flattenedDates, 'recorded'); // The second argument should match the location type
    onClose();
};
    
    const removeDateFromSelection = (dateToRemove) => {
        setCurrentSelection(prev => prev.filter(d => d !== dateToRemove));
    };

    const allConfiguredDates = useMemo(() => configuredGroups.flatMap(g => g.dates || []), [configuredGroups]);

const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Convert min/max date strings to Date objects for comparison, ignoring time
    const minDateTime = minDate ? new Date(minDate) : null;
    if (minDateTime) minDateTime.setHours(0, 0, 0, 0);
    const maxDateTime = maxDate ? new Date(maxDate) : null;
    if (maxDateTime) maxDateTime.setHours(0, 0, 0, 0);

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
      date.setHours(0, 0, 0, 0); // Ensure we are comparing dates only
      const dateStr = format(date, "yyyy-MM-dd");
      const isSelected = currentSelection.some((d) => d.date === dateStr);
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;

      // Check if the current date is outside the main event's range
      const isOutOfRange = (minDateTime && date < minDateTime) || (maxDateTime && date > maxDateTime);
      const isDisabled = isPast || isOutOfRange;

      days.push(
        <div
          key={day}
          onClick={() => !isDisabled && handleDateClick(dateStr)}
          className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${
            isDisabled
              ? "text-gray-600 cursor-not-allowed"
              : "cursor-pointer"
          } ${
            isSelected
              ? "bg-emerald-500 text-white"
              : "hover:bg-gray-700"
          } ${
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
    
    if (!isOpen) return null;

    return (
     <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] ${darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"}`}>
                <div className={`flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                            
                            <img src={Date_Form_Icon} alt=""  className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>Recorded Event Scheduler</h3>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto flex items-center justify-end gap-4">
                        <div className="flex items-center space-x-2">
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Date type:</span>
                            {["Single day", "Multi days"].map((type) => {
                  const typeMap = {
                    "Single day": "one-day",
                    "Multi days": "multi-day",
                    
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
                
                <div className="flex-grow overflow-y-auto">
                    <div className="flex flex-col md:flex-row flex-1">
                        <div className={`w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><ChevronLeftIcon /></button>
                                <span className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</span>
                                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><ChevronRightIcon /></button>
                            </div>
                            <div className={`grid grid-cols-7 text-center text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={index}>{day}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1 place-items-center">{generateCalendarDays()}</div>
                        </div>
              
                        <div className="w-full md:w-2/3 p-6 flex flex-col space-y-4">
                            <div className={`flex-shrink-0 flex items-center gap-2 flex-wrap h-[50px] overflow-y-auto custom-scrollbar border-b pb-4 pr-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                                {editingId && currentSelection.map(date => (
                                    <span key={date} className="bg-orange-500 text-white pl-3 pr-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                        {format(new Date(date.replace(/-/g, '/')), 'dd/MM/yyyy')}
                                        <button type="button" onClick={() => removeDateFromSelection(date)} className="bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs hover:bg-white/40">&times;</button>
                                    </span>
                                ))}
                                {!editingId && currentSelection.map(date => (
                                    <span key={date} className={`pl-3 pr-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                        {format(new Date(date.replace(/-/g, '/')), 'dd/MM/yyyy')}
                                        <button type="button" onClick={() => removeDateFromSelection(date)} className={`rounded-full w-4 h-4 flex items-center justify-center text-xs ${darkMode ? 'bg-gray-500/50 hover:bg-red-500' : 'bg-gray-300 hover:bg-red-500 hover:text-white'}`}>&times;</button>
                                    </span>
                                ))}
                                {configuredGroups.filter(g => g.id !== editingId).flatMap(group =>
                                    (group.dates || []).map(date => (
                                        <button key={`${group.id}-${date}`} onClick={() => handleEdit(group.id)} className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-emerald-700">
                                            {format(new Date(date.replace(/-/g, '/')), 'dd/MM/yyyy')}
                                        </button>
                                    ))
                                )}
                                {currentSelection.length === 0 && configuredGroups.length === 0 && <p className="text-sm text-gray-500">Select dates from the calendar...</p>}
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
                                            <AttachmentIcon/> {videoFile ? videoFile.name : 'Attach video'}
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
                                <button type="button" onClick={() => imageInputRef.current.click()} className={`w-full p-3 rounded-lg flex items-center justify-center font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                    <AttachmentIcon/> {previewImage ? previewImage.name : 'Video preview image'}
                                </button>
                                <input type="file" ref={imageInputRef} onChange={e => setPreviewImage(e.target.files[0])} className="hidden" accept="image/*"/>
                            </div>
                            
                            <div className="flex-shrink-0 pt-4 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleAddOrUpdate}
                                    className={`flex-grow py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${editingId ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                    disabled={currentSelection.length === 0}
                                >
                                    {editingId ? 'Update Date Group' : 'Add Date Group'}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={resetFormAndSelection} className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Cancel Edit</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}></div>
                <div className="flex justify-end items-center p-4 space-x-4">
            <button type="button" onClick={handleReset} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Reset</button>
            <button type="button" onClick={onClose} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Cancel</button>
            <button type="button" onClick={handleSaveChanges} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white">Save Dates</button>
                </div>
            </div>
        </div>
    );
};

export default RecordedDatePickerModal;