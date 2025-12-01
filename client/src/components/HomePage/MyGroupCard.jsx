import {  useNavigate } from "react-router-dom";
import GroupViewModal from "../CreateGroup/GroupViewModal";
import { getImageUrl } from "../../utils/imageUtils";
import { getMyEvents } from "../../services/ticketService";
import { useState } from "react";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";

const MyGroupsCard = ({ theme, groups, isDark }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupEventCount, setGroupEventCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const navigate = useNavigate();
  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
    setLoadingCount(true);
    
    // Fetch event count for this specific group
    try {
      const eventsRes = await getMyEvents();
      
      // Handle different response structures
      let eventsArray = [];
      if (Array.isArray(eventsRes)) {
        eventsArray = eventsRes;
      } else if (eventsRes?.tickets) {
        eventsArray = Array.isArray(eventsRes.tickets) ? eventsRes.tickets : [];
      } else if (eventsRes?.data) {
        eventsArray = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      }

      // Filter events that belong to this specific group
      const groupId = group._id || group.id;
      const filteredEvents = eventsArray.filter(event => 
        event.groupId === groupId || 
        event.group_id === groupId || 
        event.group === groupId ||
        event.group?._id === groupId ||
        event.group?.id === groupId
      );
      
      setGroupEventCount(filteredEvents.length);
    } catch (error) {
      console.error('Error fetching event count:', error);
      // Fallback to group's own count if available
      setGroupEventCount(group.totalEvents || group.events || 0);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
    setGroupEventCount(0);
  };

  const handleUpdateGroup = () => {
    console.log('Update group:', selectedGroup);
    // Add your update logic here
    // You might want to navigate to an edit page or open an edit modal
    // Example: navigate(`/group/edit/${selectedGroup._id}`);
    handleCloseModal();
  };

  return (
    <>
      <div className="h-full flex flex-col min-h-[180px]">
        <div className="flex items-center justify-between px-2 w-full mb-3 md:mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg md:text-xl font-semibold">My groups,</h3>
            <p className={`text-xs md:text-sm ${theme.subText}`}>
              {groups.length} groups
            </p>
          </div>

        </div>
        <div className="flex flex-row items-center justify-start w-full gap-4 md:gap-6 flex-grow">
          {groups.slice(0, 2).map((group, index) => {
            let imageUrl;
            if (group.grp_type === "admin") {
              imageUrl = ProfileImage;
            } else if (group.grp_type === "organization") {
              imageUrl = getImageUrl(group.company_logo) || ProfileImage;
            } else {
              imageUrl = getImageUrl(group.company_logo) || ProfileImage;
            }
            return (
              <div 
                key={index} 
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => handleGroupClick(group)}
              >
                <div
                  className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-[58px] overflow-hidden flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    boxShadow: isDark
                      ? "inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)"
                      : "inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={group.company_logo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = ProfileImage;
                    }}
                  />
                </div>
                <p
                  className={`font-medium text-xs md:text-sm ${theme.text} text-center max-w-[100px] truncate group-hover:underline`}
                >
                  {group.name}
                </p>
              </div>
            );
          })}
                    {groups.length > 2 && (
                      <div className="flex    justify-end  self-end">
            <button onClick={()=> navigate("/ticket/groups")}
                className={`text-xs  text-white  border-2  border-[#212426] p-2 rounded-full bg-[linear-gradient(180deg,#1E1242_0%,#6549B8_100%)]  hover:scale-105 duration-200 flex-shrink-0`}
                >
              See more
            </button>
              </div>
          )}
        </div>
      </div>
      {/* Group View Modal */}
      <GroupViewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        group={selectedGroup}
        isDark={isDark}
        theme={theme}
        onUpdate={handleUpdateGroup}
        totalEvents={groupEventCount}
        loadingCount={loadingCount}
      />
    </>
  );
};

export default MyGroupsCard;