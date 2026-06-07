import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUtils";
import {
  getUserGroupCapabilities,
  getGroups,
  getGroupStatistics,
  getMyLiveEvents,
  getMyEvents,
} from "../../services/ticketService";
import { ArrowLeft, Pencil, Landmark } from "lucide-react";
const GroupViewModal = ({
  isOpen,
  onClose,
  group,
  isDark,
  theme,
  onUpdate,
  totalEvents,
  loadingCount,
}) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  const modalTheme = {
    bg: isDark ? "bg-[#212426]" : "bg-[#E0E0E0]",
    text: isDark ? "text-white" : "text-gray-900",
    subText: isDark ? "text-gray-400" : "text-gray-600",
    containerBg: isDark ? "bg-[#212426]" : "bg-white",
    cardBg: isDark ? "bg-[#212426]" : "bg-gray-100",
    valueFieldBg: isDark ? "bg-[#404040]" : "bg-gray-200",
    valueFieldText: isDark ? "text-white" : "text-black",
    divider: isDark ? "bg-white" : "bg-gray-300",
    buttonPrimaryBg: "bg-[#5E5CE6]",
    buttonSecondaryBg: isDark ? "bg-[#44444D]" : "bg-gray-300",
    buttonText: "text-white",
    iconColor: isDark ? "text-white" : "text-gray-800",
    borderColor: isDark ? "border-[#767070]" : "border-gray-300",
    darkBoxShadow:
      "5.4px 5.4px 8.09px 0px #00000029, -5.4px -5.4px 8.09px 0px #FFFFFF0A",
    outerContainerBoxShadow:
      "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset",
    groupCardBoxShadow:
      "5.4px 5.4px 8.09px 0px #00000029, -5.4px -5.4px 8.09px 0px #FFFFFF0A",
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = "none";
    e.target.parentElement.innerHTML = `<span class="${modalTheme.text} text-sm">Logo</span>`;
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
        
        let eventsArray = [];
        if (Array.isArray(eventsRes)) {
          eventsArray = eventsRes;
        } else if (eventsRes?.tickets) {
          eventsArray = Array.isArray(eventsRes.tickets)
            ? eventsRes.tickets
            : [eventsRes.tickets];
        } else if (eventsRes?.data) {
          eventsArray = Array.isArray(eventsRes.data)
            ? eventsRes.data
            : [eventsRes.data];
        }
        setEvents(eventsArray);

        const groupsArray = Array.isArray(groupsRes) ? groupsRes : [];
        setGroups(groupsArray);
      } catch (e) {
        console.error("Error fetching data:", e);
        setEvents([]);
        setGroups([]);
      }
    };

    const checkEditPermissions = async () => {
      if (!group) {
        setCanEdit(false);
        setIsCheckingPermissions(false);
        return;
      }

      try {
        setIsCheckingPermissions(true);
        const groupId = group?._id || group?.id;
        // Get user capabilities for this group
        const capabilities = await getUserGroupCapabilities(groupId);
        // Check if user has edit permissions
        // Adjust this logic based on your actual capabilities structure
        const hasEditAccess = capabilities?.can_edit || 
                             capabilities?.is_admin || 
                             capabilities?.is_owner ||
                             capabilities?.permissions?.includes('edit');
        
        setCanEdit(hasEditAccess);
      } catch (error) {
        console.error("Error checking edit permissions:", error);
        setCanEdit(false);
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    if (isOpen) {
      fetchData();
      checkEditPermissions();
    }
  }, [isOpen, group]);

  if (!isOpen || !group) return null;

  const totalEventsCount = totalEvents !== undefined ? totalEvents : 0;

  const headerBorderImage = isDark
    ? "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 50.73%, rgba(255, 255, 255, 0) 100%) 1"
    : "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #000000 50.73%, rgba(0, 0, 0, 0) 100%) 1";
  const ValueField = ({ children }) => (
    <div
      className={`${modalTheme.valueFieldBg} rounded-md py-1 lg:py-2 px-2 lg:px-3 flex items-center justify-end min-h-[24px] sm:min-h-[26px] lg:min-h-[36px] flex-shrink-0 min-w-0 max-w-[55%] lg:max-w-[60%]`}
    >
      <p
        className={`${modalTheme.valueFieldText} text-[12px] sm:text-xs lg:text-sm text-right break-words`}
      >
        {children}
      </p>
    </div>
  );
  const handleUpdateClick = () => {
    const groupId = group?._id || group?.id;
    if (groupId) {
      navigate(`/ticket/edit-group/${groupId}`);
    }
    onClose();
  };

  return (
    <>
      <div
        aria-modal="true"
        role="dialog"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 pt-8 pb-24 sm:pb-2 sm:pt-0"
      >
        <div
          className={`relative shadow-2xl w-full sm:w-[600px] lg:w-[800px] xl:w-[900px] h-auto max-h-[calc(100vh-120px)] sm:max-h-[90vh] mx-auto ${modalTheme.bg}
                    rounded-[40px] sm:border-none pr-4 overflow-y-auto`}
          style={
            isDark ? { boxShadow: modalTheme.outerContainerBoxShadow } : {}
          }
        >
          <div
            className="flex flex-col w-full p-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="p-2 sm:p-3 relative flex items-center">
              <button onClick={onClose} className={`${modalTheme.text} mr-4`}>
                <ArrowLeft />
              </button>
              <h2
                className={`${modalTheme.text} font-semibold text-base sm:text-lg md:text-2xl leading-tight`}
                style={{ fontFamily: "Inter" }}
              >
                Group Details
              </h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4 lg:gap-6 xl:gap-8 items-start">
              {/* Left Column */}
              <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 items-center w-full md:w-1/2 lg:w-2/5">
                  <div
                    className={`relative w-full max-w-[200px] lg:max-w-[280px] xl:max-w-[320px] min-h-[188px] sm:min-h-[226px] lg:min-h-[280px] rounded-[26.98px] ${modalTheme.cardBg} p-1 sm:p-2 lg:p-6 flex flex-col items-center justify-center pt-4`}
                    style={
                      isDark ? { boxShadow: modalTheme.groupCardBoxShadow } : {}
                    }
                  >
                  <div className="text-center w-full">
                    <h3
                      className={`${modalTheme.text} font-bold text-sm sm:text-base lg:text-xl truncate min-w-0 w-full`}
                    >
                      {group.name}
                    </h3>
                  </div>

                  <div
                    className="relative rounded-full bg-gray-800 flex items-center justify-center w-[72px] h-[72px] my-2"
                    style={{
                      border: `3px solid ${isDark ? "#555555" : "#DDDDDD"}`,
                    }}
                  >
                    {group.company_logo ? (
                      <img
                        src={getImageUrl(group.company_logo)}
                        alt="Logo"
                        className="w-full h-full rounded-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <span
                        className={`${modalTheme.text} text-sm sm:text-base`}
                      >
                        Logo
                      </span>
                    )}
                  </div>
                  <p className="text-green-500 text-xs capitalize mb-2">
                    {group.grp_type === "organisation"
                      ? group.organisation_type
                      : group.grp_type}
                  </p>
                  <p
                    className={`${modalTheme.subText} font-bold text-base sm:text-lg lg:text-xl`}
                  >
                    {totalEventsCount}
                  </p>
                  <p
                    className={`${modalTheme.subText} font-semibold text-xs text-center`}
                  >
                    Events created
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 items-center w-full md:w-1/2 lg:w-3/5">
                <div
                  className={`p-1 sm:p-2 lg:p-6 rounded-[40px] ${modalTheme.cardBg} w-full pt-4 max-w-lg lg:max-w-none min-h-[188px] sm:min-h-[226px] lg:min-h-[280px]`}
                  style={isDark ? { boxShadow: modalTheme.darkBoxShadow } : {}}
                >
                  <div className="flex justify-between items-center mb-3 px-2">
                    <div className="flex items-center gap-2">
                      <Landmark className={modalTheme.iconColor} size={20} />
                      <h3
                        className={`${modalTheme.text} font-bold text-sm sm:text-base md:text-lg`}
                        style={{ fontFamily: "Inter" }}
                      >
                        Bank Details
                      </h3>
                    </div>
                    {canEdit && !isCheckingPermissions && (
                      <button
                        onClick={handleUpdateClick}
                        className={`rounded-full p-1 ${modalTheme.buttonPrimaryBg} ${modalTheme.buttonText}`}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  <div
                    className="w-full"
                    style={{
                      borderBottom: "1px solid transparent",
                      borderImage: headerBorderImage,
                    }}
                  ></div>
                  <div className="px-2 sm:px-3 lg:px-6 py-0.5 sm:py-1 lg:py-3 flex flex-col gap-2 sm:gap-2.5 lg:gap-4">
                    <div className="flex flex-row justify-between items-start gap-2 sm:gap-3 lg:gap-6 min-w-0">
                      <p
                        className={`${modalTheme.text} text-[11px] sm:text-xs lg:text-sm flex-shrink-0 pt-1 lg:pt-1.5 min-w-[100px] lg:min-w-[140px]`}
                      >
                        Account Holder
                      </p>
                      <ValueField>
                        {group.primary_bank_acc_holder || "N/A"}
                      </ValueField>
                    </div>
                    <div className="flex flex-row justify-between items-start gap-1.5 sm:gap-2 min-w-0">
                      <p
                        className={`${modalTheme.text} text-[11px] sm:text-xs flex-shrink-0 pt-1`}
                      >
                        IFSC Code
                      </p>
                      <ValueField>
                        {group.primary_bank_ifsc || "N/A"}
                      </ValueField>
                    </div>
                    <div className="flex flex-row justify-between items-start gap-1.5 sm:gap-2 min-w-0">
                      <p
                        className={`${modalTheme.text} text-[11px] sm:text-xs flex-shrink-0 pt-1`}
                      >
                        Account Type
                      </p>
                      <ValueField>
                        {group.primary_bank_acc_type}
                      </ValueField>
                    </div>
                    <div className="flex flex-row justify-between items-start gap-1.5 sm:gap-2 min-w-0">
                      <p
                        className={`${modalTheme.text} text-[11px] sm:text-xs flex-shrink-0 pt-1`}
                      >
                        Account Number
                      </p>
                      <ValueField>
                        {group.primary_bank_acc_no || "N/A"}
                      </ValueField>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row justify-center items-center w-full gap-[6.37px] sm:gap-[10px] mb-4 sm:mb-0">
                  <button
                    onClick={onClose}
                    className={`${
                      isDark ? "text-white" : "text-black"
                    } border-solid ${
                      modalTheme.buttonSecondaryBg
                    } ${canEdit && !isCheckingPermissions ? 'w-[82px]' : 'w-full max-w-[178px]'} h-[29px] rounded-[31.84px] border-[0.32px] px-[12.74px] py-[5.1px] text-xs
                                                      sm:${canEdit && !isCheckingPermissions ? 'w-[178px]' : 'w-full max-w-[378px]'} sm:h-[45px] sm:rounded-[50px] sm:border-[0.5px] sm:px-[20px] sm:py-[8px] sm:text-base`}
                    style={{
                      borderImageSource: isDark
                        ? "linear-gradient(0deg, rgba(255, 255, 255, 0) -8.33%, rgba(255, 255, 255, 0.5) 183.33%)"
                        : "none",
                      boxShadow: isDark
                        ? modalTheme.outerContainerBoxShadow
                        : "none",
                    }}
                  >
                    {canEdit && !isCheckingPermissions ? 'Cancel' : 'Close'}
                  </button>
                  {canEdit && !isCheckingPermissions && (
                    <button
                      onClick={handleUpdateClick}
                      className={`${modalTheme.buttonText} border-solid ${modalTheme.buttonPrimaryBg} w-[82px] h-[29px] rounded-[31.84px] border-[0.32px] px-[12.74px] py-[5.1px] text-xs
                                                      sm:w-[178px] sm:h-[45px] sm:rounded-[50px] sm:border-[0.5px] sm:px-[20px] sm:py-[8px] sm:text-base`}
                      style={{
                        borderImageSource: isDark
                          ? "linear-gradient(0deg, rgba(255, 255, 255, 0) -8.33%, rgba(255, 255, 255, 0.5) 183.33%)"
                          : "none",
                        boxShadow: isDark
                          ? modalTheme.outerContainerBoxShadow
                          : "none",
                      }}
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default GroupViewModal;
