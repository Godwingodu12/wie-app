import React, { useEffect, useState } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameDay,
    isSameMonth,
    eachDayOfInterval
} from "date-fns";
import Date_Form_Icon from "../../assets/Event/Date_Form_Icon.svg?react";
import TimePicker from "./TimePicker";
import ConfirmModal from "./ConfirmModal";

// Internal SVG components for navigation arrows
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

// Helper function to convert 24-hour time string back to 12-hour format and ampm
const convertTo12Hour = (time24h) => {
    if (!time24h || !time24h.includes(':')) return { time: "12:00", ampm: "AM" };

    const [hourStr, minuteStr] = time24h.split(':');
    let hours = parseInt(hourStr, 10);
    const minutes = minuteStr || '00';
    let ampm = 'AM';

    if (hours === 0) {
        hours = 12; // 00:xx is 12:xx AM (Midnight)
    } else if (hours === 12) {
        ampm = 'PM'; // 12:xx is 12:xx PM (Noon)
    } else if (hours > 12) {
        hours -= 12; // 13:xx is 01:xx PM
        ampm = 'PM';
    }

    const time = `${hours.toString().padStart(2, '0')}:${minutes}`;

    return { time, ampm };
};

// Helper function to convert 12-hour format to 24-hour format (for saving)
const convertTo24Hour = (time12h, ampm) => {
    if (!time12h || !ampm) return "";
    const [hours, minutes] = time12h.split(":");
    let hour24 = parseInt(hours, 10);

    // AM logic: 12 AM (midnight) becomes 0
    if (ampm === "AM" && hour24 === 12) hour24 = 0;

    // PM logic: 12 PM (noon) stays 12. 1 PM to 11 PM adds 12
    if (ampm === "PM" && hour24 !== 12) hour24 += 12;

    return `${hour24.toString().padStart(2, "0")}:${minutes}`;
};


const DatePickerModal = ({ isOpen, onClose, onSave, initialDates, initialDateType, darkMode, showAlert, minDate, maxDate }) => {
    const [dateType, setDateType] = useState("one-day");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState([]);
    const [useSameTime, setUseSameTime] = useState(true);
    const [timeError, setTimeError] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [useSameDetails] = useState(true);
    // Initialize date type from parent component
    useEffect(() => {
        if (isOpen) {
            if (initialDateType) {
                setDateType(initialDateType);
            } else if (initialDates && initialDates.length > 0) {
                if (initialDates.length === 1) {
                    setDateType("one-day");
                } else {
                    setDateType("multi-day");
                }
            } else {
                setDateType("one-day");
            }
        }
    }, [isOpen, initialDates, initialDateType]);


    useEffect(() => {
        if (isOpen) {
            const dates = initialDates || [];
            setTimeError("");

            console.log("Modal Opened. Raw initialDates received:", dates);

            // Convert 24h stored time to 12h display format
            const preparedDates = dates.map(d => {
                // Check if conversion is needed (i.e., startAmPm/endAmPm fields are missing)
                const needsConversion = !d.startAmPm || !d.endAmPm;

                const timeDetails = needsConversion ? {
                    startTime: convertTo12Hour(d.startTime).time,
                    startAmPm: convertTo12Hour(d.startTime).ampm,
                    endTime: convertTo12Hour(d.endTime).time,
                    endAmPm: convertTo12Hour(d.endTime).ampm,
                } : {
                    startTime: d.startTime,
                    startAmPm: d.startAmPm,
                    endTime: d.endTime,
                    endAmPm: d.endAmPm,
                };

                return {
                    ...d,
                    ...timeDetails
                };
            });

            setSelectedDates(preparedDates);
            setCurrentMonth(preparedDates.length > 0 ? new Date(preparedDates[0].date.replace(/-/g, "/")) : new Date());

            // Set useSameTime flag based on loaded data
            let allSameTime = true;
            if (preparedDates.length > 1) {
                const first = preparedDates[0];
                allSameTime = preparedDates.every(d =>
                    d.startTime === first.startTime &&
                    d.endTime === first.endTime &&
                    d.startAmPm === first.startAmPm &&
                    d.endAmPm === first.endAmPm
                );
            }
            setUseSameTime(allSameTime);

            console.log("Prepared Dates (State):", preparedDates);
            console.log("useSameTime set to:", allSameTime);
        }
    }, [isOpen, initialDates, initialDateType]);
    const handleReset = () => {
        setIsConfirmOpen(true);
    };

    const executeReset = () => {
        setSelectedDates([]);
        setCurrentMonth(new Date());
        setIsConfirmOpen(false);
        setUseSameTime(true);
    };

    const handleDateTypeChange = (type) => {
        setSelectedDates([]);
        const typeMap = {
            "Single day": "one-day",
            "Multi days": "multi-day",
            "Weekly": "weekly",
            "Recurring": "recurring"
        };
        setDateType(typeMap[type] || type);
    };


    const validateTime = (startTime, startAmPm, endTime, endAmPm) => {
        if (!startTime || !startAmPm || !endTime || !endAmPm) {
            return true;
        }

        const start24 = convertTo24Hour(startTime, startAmPm);
        const end24 = convertTo24Hour(endTime, endAmPm);

        if (!start24 || !end24 || start24.length !== 5 || end24.length !== 5) return true;

        const isValid = new Date(`1970-01-01T${end24}:00`) > new Date(`1970-01-01T${start24}:00`);

        return isValid;
    };
    const generateCalendarDays = () => {
        const datefnsStartOfMonth = startOfMonth(currentMonth);
        const start = startOfWeek(datefnsStartOfMonth);
        const end = endOfWeek(endOfMonth(currentMonth));

        const daysInMonthView = eachDayOfInterval({ start, end });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // FIX: Proper date parsing with timezone handling
        const minDateTime = minDate ? new Date(minDate + 'T00:00:00') : null;
        if (minDateTime) minDateTime.setHours(0, 0, 0, 0);

        const maxDateTime = maxDate ? new Date(maxDate + 'T00:00:00') : null;
        if (maxDateTime) maxDateTime.setHours(0, 0, 0, 0);

        return daysInMonthView.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const isSelected = selectedDates.some((d) => d.date === dateStr);
            const isToday = isSameDay(date, today);
            const isCurrentMonth = isSameMonth(date, currentMonth);

            const isPast = date < today;

            // Check if date is outside the allowed range
            const isBeforeMin = minDateTime && date < minDateTime;
            const isAfterMax = maxDateTime && date > maxDateTime;
            const isOutOfRange = isBeforeMin || isAfterMax;

            const isDisabled = isPast || isOutOfRange;

            const textColor = isCurrentMonth
                ? isDisabled ? "text-gray-500" : ""
                : `${darkMode ? "text-gray-600" : "text-gray-400"}`;

            return (
                <div
                    key={dateStr}
                    onClick={() => !isDisabled && isCurrentMonth && handleDateClick(dateStr)}
                    className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors text-center ${isDisabled
                            ? "text-gray-500 cursor-not-allowed opacity-40 line-through"
                            : isCurrentMonth ? "cursor-pointer" : "cursor-not-allowed"
                        } ${isSelected
                            ? "bg-emerald-500 text-white"
                            : `hover:bg-gray-700 ${textColor}`
                        } ${isToday && !isSelected
                            ? "border border-emerald-500"
                            : ""
                        }`}
                >
                    <span className={`${!isCurrentMonth ? 'opacity-50' : ''}`}>
                        {format(date, "d")}
                    </span>
                </div>
            );
        });
    };
    const renderDayNames = () => {
        return ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index}>{day}</div>
        ));
    };

    const handleDateClick = (dateStr) => {
        const defaultTime = { startTime: "12:00", endTime: "12:00", startAmPm: "AM", endAmPm: "AM" };

        const commonDetails = selectedDates.length > 0 && useSameTime ? {
            startTime: selectedDates[0].startTime,
            endTime: selectedDates[0].endTime,
            startAmPm: selectedDates[0].startAmPm,
            endAmPm: selectedDates[0].endAmPm,
        } : {
            ...defaultTime
        };

        const isAlreadySelected = selectedDates.some(d => d.date === dateStr);
        let newDates;

        if (dateType === 'one-day') {
            newDates = isAlreadySelected ? [] : [{ date: dateStr, endDate: dateStr, ...commonDetails }];
        } else if (dateType === 'weekly') {
            const clickedDayOfWeek = new Date(dateStr.replace(/-/g, "/")).getDay();
            const isDaySelected = selectedDates.some(d => new Date(d.date.replace(/-/g, "/")).getDay() === clickedDayOfWeek);

            if (isDaySelected) {
                newDates = selectedDates.filter(d => new Date(d.date.replace(/-/g, "/")).getDay() !== clickedDayOfWeek);
            } else {
                newDates = [...selectedDates];
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const today = new Date(); today.setHours(0, 0, 0, 0);

                const minDateTime = minDate ? new Date(minDate + 'T00:00:00') : null;
                if (minDateTime) minDateTime.setHours(0, 0, 0, 0);
                const maxDateTime = maxDate ? new Date(maxDate + 'T00:00:00') : null;
                if (maxDateTime) maxDateTime.setHours(0, 0, 0, 0);

                const datefnsStartOfMonth = startOfMonth(currentMonth);
                const start = startOfWeek(datefnsStartOfMonth);
                const end = endOfWeek(endOfMonth(currentMonth));
                const daysInMonthView = eachDayOfInterval({ start, end });

                daysInMonthView.forEach((dayDateObj) => {
                    const isCurrentMonth = isSameMonth(dayDateObj, currentMonth);
                    const isPast = dayDateObj < today;
                    const isBeforeMin = minDateTime && dayDateObj < minDateTime;
                    const isAfterMax = maxDateTime && dayDateObj > maxDateTime;
                    const isDisabled = isPast || isBeforeMin || isAfterMax || !isCurrentMonth;

                    if (!isDisabled && dayDateObj.getDay() === clickedDayOfWeek) {
                        const dateStrFormat = format(dayDateObj, "yyyy-MM-dd");
                        if (!selectedDates.some(d => d.date === dateStrFormat)) {
                            newDates.push({ date: dateStrFormat, endDate: dateStrFormat, ...commonDetails });
                        }
                    }
                });
            }
        } else {
            if (isAlreadySelected) {
                newDates = selectedDates.filter(d => d.date !== dateStr);
            } else {
                newDates = [...selectedDates, { date: dateStr, endDate: dateStr, ...commonDetails }];
            }
        }
        setSelectedDates(newDates.sort((a, b) => new Date(a.date.replace(/-/g, "/")) - new Date(b.date.replace(/-/g, "/"))));
    };

    const handleIndividualTimeChange = (index, field, value) => {
        let updatedDates = [...selectedDates];

        const targetIndex = useSameTime ? 0 : index;

        if (updatedDates[targetIndex]) {
            updatedDates[targetIndex] = { ...updatedDates[targetIndex], [field]: value };
        }

        if (useSameTime && selectedDates.length > 0) {
            const updatedFirstDate = updatedDates[0];
            updatedDates = updatedDates.map(d => ({
                ...d,
                startTime: updatedFirstDate.startTime,
                endTime: updatedFirstDate.endTime,
                startAmPm: updatedFirstDate.startAmPm,
                endAmPm: updatedFirstDate.endAmPm
            }));
        }

        const dateToValidate = updatedDates[targetIndex];
        let errorMsg = "End time must be after the start time.";
        let hasError = false;

        if (dateToValidate && !validateTime(dateToValidate.startTime, dateToValidate.startAmPm, dateToValidate.endTime, dateToValidate.endAmPm)) {
            hasError = true;
        }

        if (hasError) {
            if (!timeError && showAlert) {
                showAlert({ type: 'error', message: 'Invalid Time Range', description: errorMsg });
            }
            setTimeError(errorMsg);
        } else {
            setTimeError("");
        }

        setSelectedDates(updatedDates);
    };
    const handleUseSameTimeChange = (e) => {
        const isEnabled = e.target.checked;
        setUseSameTime(isEnabled);

        if (isEnabled && selectedDates.length > 1) {
            const firstDate = selectedDates[0];
            setSelectedDates(selectedDates.map(d => ({
                ...d,
                startTime: firstDate.startTime,
                endTime: firstDate.endTime,
                startAmPm: firstDate.startAmPm,
                endAmPm: firstDate.endAmPm
            })));
        }
    };
    const handleSave = () => {
        if (selectedDates.length === 0) {
            if (showAlert) {
                showAlert({ type: 'warning', message: 'No Dates Selected', description: 'Please select at least one date to save.' });
            }
            return;
        }

        if (timeError) {
            showAlert({ type: 'error', message: 'Invalid Time', description: timeError });
            return;
        }

        for (const dateEntry of selectedDates) {
            if (!validateTime(dateEntry.startTime, dateEntry.startAmPm, dateEntry.endTime, dateEntry.endAmPm)) {
                const errorMsg = "End time must be after the start time.";
                showAlert({
                    type: 'error',
                    message: 'Invalid Time Range',
                    description: `Please correct the time for ${format(new Date(dateEntry.date.replace(/-/g, "/")), "dd/MM/yyyy")}. ${errorMsg}`
                });
                return;
            }
        }
        // Convert to 24-hour format but keep frontend field names for CreateTicket
        const convertedDates = selectedDates.map((dateEntry) => {
            const start24 = convertTo24Hour(dateEntry.startTime, dateEntry.startAmPm);
            const end24 = convertTo24Hour(dateEntry.endTime, dateEntry.endAmPm);
            return {
                date: dateEntry.date,
                endDate: dateEntry.endDate,
                // Keep these in 12-hour format for the parent component
                startTime: dateEntry.startTime,
                startAmPm: dateEntry.startAmPm,
                endTime: dateEntry.endTime,
                endAmPm: dateEntry.endAmPm,
                // Keep other fields if they exist
                ...(dateEntry.eventLink && { eventLink: dateEntry.eventLink }),
                ...(dateEntry.videoName && { videoName: dateEntry.videoName }),
                ...(dateEntry.verificationCode && { verificationCode: dateEntry.verificationCode }),
            };
        });
        onSave(convertedDates, dateType);
        onClose();
    };
    const removeDate = (dateToRemove) => {
        setSelectedDates(prevDates => prevDates.filter(d => d.date !== dateToRemove));
    };
    if (!isOpen) return null;

    return (
        <>
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmModal(false)}
                onConfirm={executeReset}
                title="Confirm Reset"
                message="Are you sure you want to clear all selected dates and times?"
                darkMode={darkMode}
            />
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className={`rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] ${darkMode ? "bg-[#2B2B2B] text-gray-200" : "bg-white text-gray-800"}`}>

                    <div className={`flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                <img src={Date_Form_Icon} alt="" className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>Event Calendar</h3>
                                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Schedule your event's date and time</p>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4">
                            <div className="flex items-center space-x-2">
                                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Date type:</span>
                                {["Single day", "Multi days", "Weekly", "Recurring"].map((type) => {
                                    const typeMap = { "Single day": "one-day", "Multi days": "multi-day", "Weekly": "weekly", "Recurring": "recurring" };
                                    return (
                                        <button
                                            type="button"
                                            key={type}
                                            onClick={() => handleDateTypeChange(type)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${dateType === (typeMap[type] || type)
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
                            <div className={`w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><ChevronLeftIcon /></button>
                                    <span className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</span>
                                    <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><ChevronRightIcon /></button>
                                </div>
                                <div className={`grid grid-cols-7 text-center text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {renderDayNames()}
                                </div>
                                <div className="grid grid-cols-7 gap-1 place-items-center">{generateCalendarDays()}</div>
                            </div>

                            <div className="w-full md:w-1/2 p-4 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <label className={`flex items-center text-sm cursor-pointer ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        <input type="checkbox" checked={useSameTime} onChange={handleUseSameTimeChange} className={`form-checkbox h-4 w-4 rounded border text-emerald-500 focus:ring-emerald-500 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-200 border-gray-400'}`} />
                                        <span className="ml-2">Use same time for all dates</span>
                                    </label>
                                </div>

                                <div className="flex-grow md:h-[40vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {selectedDates.length > 0 ? selectedDates.map((item, index) => {
                                        const isTimePickerDisabled = useSameTime && index !== 0;
                                        return (
                                            <div key={index} className={`relative p-3 rounded-lg border ${darkMode ? "bg-black/20 border-gray-700" : "bg-gray-100 border-gray-300"}`}>
                                                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                                                    <span className={`px-3 py-2 rounded-lg text-sm w-full md:w-auto flex-shrink-0 text-center ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800"}`}>
                                                        {format(new Date(item.date.replace(/-/g, "/")), "dd/MM/yyyy")}
                                                    </span>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <TimePicker
                                                            time={item.startTime}
                                                            ampm={item.startAmPm}
                                                            onTimeChange={(newTime) => handleIndividualTimeChange(index, "startTime", newTime)}
                                                            onAmPmChange={(newAmPm) => handleIndividualTimeChange(index, "startAmPm", newAmPm)}
                                                            darkMode={darkMode}
                                                            disabled={isTimePickerDisabled}
                                                        />
                                                        <span className="text-gray-400 text-sm">to</span>
                                                        <TimePicker
                                                            time={item.endTime}
                                                            ampm={item.endAmPm}
                                                            onTimeChange={(newTime) => handleIndividualTimeChange(index, "endTime", newTime)}
                                                            onAmPmChange={(newAmPm) => handleIndividualTimeChange(index, "endAmPm", newAmPm)}
                                                            darkMode={darkMode}
                                                            disabled={isTimePickerDisabled}
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeDate(item.date)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                                                    aria-label="Remove Date"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center text-gray-500 pt-16">
                                            <p>Select dates from the calendar to get started.</p>
                                        </div>
                                    )}
                                </div>
                                {timeError && <p className="text-red-500 text-sm mt-2 text-center">{timeError}</p>}
                            </div>
                        </div>
                    </div>

                    <div className={`flex-shrink-0 border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}></div>
                    <div className="flex-shrink-0 flex justify-end items-center p-4 space-x-4">
                        <button type="button" onClick={handleReset} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Reset</button>
                        <button type="button" onClick={onClose} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Cancel</button>
                        <button type="button" onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white">Save</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DatePickerModal;
