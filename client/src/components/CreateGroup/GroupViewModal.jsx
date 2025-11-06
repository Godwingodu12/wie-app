import React, { useState, useEffect } from "react";
import { getImageUrl } from "../../utils/imageUtils";
import {
  getUserGroupCapabilities,
  getGroups,
  getGroupStatistics,
  getMyLiveEvents,
  getMyEvents,
} from "../../services/ticketService";
const GroupViewModal = ({ isOpen, onClose, group, isDark, theme, onUpdate, totalEvents, loadingCount }) => {
    const [events, setEvents] = useState([]);
    const [groups, setGroups] = useState([]);
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
    e.target.parentElement.innerHTML = '<span class="text-white text-sm">Logo</span>';
  };
useEffect(() => {
  const fetchData = async () => {
    try {
      const [eventsRes, groupsRes, liveEventsRes, groupStatsRes] =
        await Promise.all([
          getMyEvents(),
          getGroups(),
          getMyLiveEvents(),
          getGroupStatistics(),
        ]);
      // Properly handle events array
      let eventsArray = [];
      if (Array.isArray(eventsRes)) {
        eventsArray = eventsRes;
      } else if (eventsRes?.tickets) {
        eventsArray = Array.isArray(eventsRes.tickets) ? eventsRes.tickets : [eventsRes.tickets];
      } else if (eventsRes?.data) {
        eventsArray = Array.isArray(eventsRes.data) ? eventsRes.data : [eventsRes.data];
      }
      setEvents(eventsArray);
      const groupsArray = Array.isArray(groupsRes) ? groupsRes : [];
      setGroups(groupsArray);
      // ... rest of the code
    } catch (e) {
      console.error("Error fetching data:", e);
      setEvents([]);
      setGroups([]);
    }
  };

  fetchData();
}, []);
    if (!isOpen || !group) return null;
  const totalEventsCount = totalEvents !== undefined ? totalEvents : 0;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        
        <div
          className={`relative ${theme.bg} rounded-[30px] md:rounded-[50px] shadow-2xl w-full md:w-[867px] h-auto`}
          style={{
            paddingBottom: "40px",
          }}
        >

          {/* Header */}
          <div className="px-6 md:px-[103px] pt-6 md:pt-[34px]">
            <h2
              className={`${theme.text} font-semibold text-[32px] leading-[100%]`}
              style={{ fontFamily: 'Inter' }}
            >
              Group Details
            </h2>
          </div>

          {/* Divider */}
          <div
            className="mx-[2px] mt-[25px]"
            style={{
              height: '1px',
              background: isDark
                ? 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 50.73%, rgba(255, 255, 255, 0) 100%)'
                : 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #000000 50.73%, rgba(0, 0, 0, 0) 100%)',
            }}
          />

          {/* Content */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-[34px] px-6 md:px-[51px] pt-6 md:pt-[49px]">

            {/* Left Card */}
            <div
              className={`${theme.bg} rounded-[30px] md:rounded-[40px] p-6 md:p-8 flex flex-col items-center justify-center w-full md:w-[298px]`}
              style={{
                minHeight: '250px',
                boxShadow: isDark
                  ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
                  : "8px 8px 12px 0px #00000014, -8px -8px 12px 0px #FFFFFF33",
              }}
            >
              <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-4 overflow-hidden">
                {group.company_logo ? (
                  <img
                    src={getImageUrl(group.company_logo)}
                    alt="Logo"
                    className="w-full h-full rounded-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <span className="text-white text-sm">Logo</span>
                )}
              </div>

              <h3 className={`${theme.text} font-semibold text-xl mb-2 text-center`}>
                {group.name}
              </h3>

              <p className={`${theme.subText} text-sm capitalize`}>
                {group.grp_type === 'organisation'
                  ? group.organisation_type
                  : group.grp_type}
              </p>
            </div>

            {/* Right Card - Bank Details */}
            <div
              className={`${theme.bg} flex flex-col`}
              style={{
                width: "360px",
                borderRadius: "40px",
                padding: "24px",
                boxShadow: isDark
                  ? "6px 6px 10px 0px #00000029, -6px -6px 10px 0px #FFFFFF0A"
                  : "6px 6px 10px 0px #00000014, -6px -6px 10px 0px #FFFFFF33",
              }}
            >
              <h3 className={`${theme.text} font-medium text-base mb-4`} style={{ fontFamily: "Inter" }}>
                Bank Details:
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between w-full">
                  <p className={`${theme.subText} text-sm`}>Account Type</p>
                  <p className={`${theme.text} font-medium`}>
                    {group.primary_bank_acc_type?.toUpperCase() || "N/A"}
                  </p>
                </div>

                <div className="flex justify-between w-full">
                  <p className={`${theme.subText} text-sm`}>Account Holder</p>
                  <p className={`${theme.text} font-medium`}>
                    {group.primary_bank_acc_holder || "N/A"}
                  </p>
                </div>

                <div className="flex justify-between w-full">
                  <p className={`${theme.subText} text-sm`}>Account Number</p>
                  <p className={`${theme.text} font-medium`}>
                    {group.primary_bank_acc_no || "N/A"}
                  </p>
                </div>

                <div className="flex justify-between w-full">
                  <p className={`${theme.subText} text-sm`}>IFSC Code</p>
                  <p className={`${theme.text} font-medium`}>
                    {group.primary_bank_ifsc || "N/A"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-[51px] py-6 mt-6">

            {/* Total Events */}
            <div
              className={`${theme.bg} rounded-2xl px-6 py-3 min-w-[150px]`}
              style={{
                boxShadow: isDark
                  ? "4px 4px 8px 0px #00000029, -4px -4px 8px 0px #FFFFFF0A"
                  : "4px 4px 8px 0px #00000014, -4px -4px 8px 0px #FFFFFF",
              }}
            >
              <p className={`${theme.subText} text-sm mb-1`}>Total Events</p>
              <p className={`${theme.text} font-bold text-2xl`}>{totalEventsCount}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-[20px] py-[8px] rounded-[50px] text-white text-[20px] hover:opacity-90"
                style={{ background: "#44444D" }}
              >
                Go Back
              </button>
            </div>

          </div>

        </div>
      </div>
    </>
  );
};
export default GroupViewModal;
