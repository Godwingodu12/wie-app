// src/components/FilterButton.jsx
import React, { useState } from "react";
import DateIcon from "../../assets/FilterButton/DateIcon.svg";
import GroupIcon from "../../assets/FilterButton/GroupIcon.svg";
import RevenueIcon from "../../assets/FilterButton/RevenueIcon.svg";
import TicketIcon from "../../assets/FilterButton/TicketIcon.svg";
import DownIcon from "../../assets/FilterButton/DownIcon.svg";

// Utility: generate simple calendar
const generateCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let calendar = [];
  let week = [];
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }
  if (week.length > 0) calendar.push(week);
  return calendar;
};

const FilterButton = () => {
  const [openSection, setOpenSection] = useState(null);

  const today = new Date();
  const [dateFilter, setDateFilter] = useState("");
  const [customDate, setCustomDate] = useState(today);
  const [customDateInput, setCustomDateInput] = useState(
    today.toLocaleDateString("en-GB")
  );
  const [bookingFilter, setBookingFilter] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleCancel = () => {
    setDateFilter("");
    setCustomDate(today);
    setCustomDateInput(today.toLocaleDateString("en-GB"));
    setBookingFilter("");
    setRevenueFilter("");
    setGroupFilter("");
    setOpenSection(null);
  };

  const handleApply = () => {
    setLoading(true);
    setTimeout(() => {
      console.log({
        dateFilter,
        customDate: dateFilter === "Custom Date" ? customDate : null,
        bookingFilter,
        revenueFilter,
        groupFilter,
      });
      setLoading(false);
    }, 1200);
  };

  const Section = ({ id, icon, title, children }) => (
    <div className="mb-3">
      <button
        className="w-full flex justify-between items-center px-4 py-3 rounded-lg border border-[#3d3d3d]"
        onClick={() => toggleSection(id)}
      >
        <span className="flex items-center gap-2">
          <img src={icon} alt={title} className="w-5 h-5" />
          {title}
        </span>
        <img
          src={DownIcon}
          alt="toggle"
          className={`w-4 h-4 transform transition-transform duration-200 ${
            openSection === id ? "rotate-180" : ""
          }`}
        />
      </button>
      {openSection === id && (
        <div className="mt-2 px-4 py-3 rounded-lg border border-[#3d3d3d] space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#3d3d3d] scrollbar-track-[#212426]">
          {children}
        </div>
      )}
    </div>
  );

  const month = customDate.getMonth();
  const year = customDate.getFullYear();
  const days = generateCalendar(year, month);

  return (
    <div className="w-80 max-w-[90vw] rounded-2xl shadow-xl p-4 text-white space-y-4 bg-[#212426]">
      <h2 className="font-semibold text-lg mb-2">Filter Events</h2>

      {/* Date */}
      <Section id="date" icon={DateIcon} title="Date">
        {[
          "Today",
          "This week",
          "This Month",
          "Newest First",
          "Oldest First",
          "Custom Date",
        ].map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="radio"
              name="dateFilter"
              value={opt}
              checked={dateFilter === opt}
              onChange={() => setDateFilter(opt)}
              className="w-4 h-4 accent-[#5E5CE6]"
            />
            {opt}
          </label>
        ))}

        {dateFilter === "Custom Date" && (
          <div className="mt-3 space-y-3">
            {/* Selected Date Input */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#3d3d3d] text-sm">
              <input
                type="text"
                value={customDateInput}
                onChange={(e) => {
                  setCustomDateInput(e.target.value);
                  const parts = e.target.value.split("-");
                  if (parts.length === 3) {
                    const [day, month, year] = parts.map(Number);
                    const parsed = new Date(year, month - 1, day);
                    if (!isNaN(parsed)) setCustomDate(parsed);
                  }
                }}
                className="bg-transparent outline-none flex-1 text-white"
                placeholder="DD-MM-YYYY"
              />
              <span role="img" aria-label="calendar">
                📅
              </span>
            </div>

            {/* Calendar */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs overflow-y-auto max-h-[250px] pr-1 scrollbar-thin scrollbar-thumb-[#3d3d3d] scrollbar-track-[#212426]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="opacity-70">
                  {d}
                </div>
              ))}
              {days.map((week, wi) =>
                week.map((day, di) =>
                  day ? (
                    <button
                      key={`${wi}-${di}`}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition ${
                        customDate.getDate() === day
                          ? "bg-[#5E5CE6]"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        const newDate = new Date(year, month, day);
                        setCustomDate(newDate);
                        setCustomDateInput(newDate.toLocaleDateString("en-GB"));
                      }}
                    >
                      {day}
                    </button>
                  ) : (
                    <div key={`${wi}-${di}`} />
                  )
                )
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Booking */}
      <Section id="booking" icon={TicketIcon} title="Booking Filter">
        {["Most booking", "Least booking"].map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="radio"
              name="bookingFilter"
              value={opt}
              checked={bookingFilter === opt}
              onChange={() => setBookingFilter(opt)}
              className="w-4 h-4 accent-[#5E5CE6]"
            />
            {opt}
          </label>
        ))}
      </Section>

      {/* Revenue */}
      <Section id="revenue" icon={RevenueIcon} title="Revenue Filter">
        {["Highest revenue", "Least revenue"].map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="radio"
              name="revenueFilter"
              value={opt}
              checked={revenueFilter === opt}
              onChange={() => setRevenueFilter(opt)}
              className="w-4 h-4 accent-[#5E5CE6]"
            />
            {opt}
          </label>
        ))}
      </Section>

      {/* Group */}
      <Section id="group" icon={GroupIcon} title="Group">
        {["All groups", "Admin/Self groups", "Organisation groups"].map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="radio"
              name="groupFilter"
              value={opt}
              checked={groupFilter === opt}
              onChange={() => setGroupFilter(opt)}
              className="w-4 h-4 accent-[#5E5CE6]"
            />
            {opt}
          </label>
        ))}
      </Section>

      {/* Action Buttons */}
<div className="flex justify-between pt-4">
  <button
    className="flex-1 mr-2 py-3 rounded-full text-sm font-medium shadow-md"
    style={{ backgroundColor: "rgba(68,68,77,1)" }}
    onClick={handleCancel}
  >
    Cancel
  </button>
  <button
    className="flex-1 ml-2 py-3 rounded-full text-sm font-medium shadow-md"
    style={{ backgroundColor: "rgba(94,92,230,1)" }}
    onClick={handleApply}
    disabled={loading}
  >
    {loading ? "Applying..." : "Apply"}
  </button>
</div>

    </div>
  );
};

export default FilterButton;
