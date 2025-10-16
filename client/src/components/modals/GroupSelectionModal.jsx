import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainImage from '../../assets/Event/main.png';
import { groupEventCount } from '../../services/ticketService';
const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/50';
  
  if (typeof path === 'object') {
    path = path.path || path.url || null;
  }
  
  if (typeof path !== 'string') {
    console.warn('Invalid path type:', typeof path, path);
    return 'https://via.placeholder.com/50';
  }
  
  let cleanPath = path.replace(/\\/g, '/');
  cleanPath = cleanPath.replace(/^src\//, '');
  cleanPath = cleanPath.replace(/^\//, '');
  
  const fullUrl = `${API_BASE_URL}/${cleanPath}`;
  return fullUrl;
};

const GroupSelectionModal = ({ groups, isOpen, onClose, onSelectGroup, isDark = true }) => {
  const navigate = useNavigate();
  const [groupsWithCount, setGroupsWithCount] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEventCounts = async () => {
      if (!isOpen) {
        return;
      }

      if (!groups || groups.length === 0) {
        setGroupsWithCount([]);
        return;
      }

      setLoading(true);
      try {
        const response = await groupEventCount();
        
        if (response && response.groups) {
          const updatedGroups = groups.map(group => {
            const groupWithCount = response.groups.find(g => g._id === group._id);
            return {
              ...group,
              events_count: groupWithCount ? groupWithCount.events_count : 0
            };
          });
          setGroupsWithCount(updatedGroups);
        } else {
          setGroupsWithCount(groups);
        }
      } catch (error) {
        console.error('Error fetching event counts:', error);
        setGroupsWithCount(groups);
      } finally {
        setLoading(false);
      }
    };

    fetchEventCounts();
  }, [isOpen, groups]);

  if (!isOpen) return null;

  const handleSelectGroup = (group) => {
    onSelectGroup(group);
    navigate(`/ticket/create-event/${group._id}`);
  };

  const handleCreateNewGroup = () => {
    onClose();
    navigate('/ticket/create-group');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2"
      onClick={handleBackdropClick}
    >
      <div className={`${isDark ? 'bg-[#212426]' : 'bg-white'} rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl`}>
        
        {/* Header Image */}
        <div className="relative h-24">
          <img
            src={MainImage}
            alt="Event Header"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-[rgba(103,103,103,1)] rounded-md hover:bg-[rgba(83,83,83,1)] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="p-3">
          <h2 className={`text-base font-bold text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create a new event
          </h2>
          <p className={`mt-1 text-xs text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose from your existing groups or create a new one.
          </p>
        </div>

        {/* Group List */}
        <div className="px-3 space-y-2 max-h-[150px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-3">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading event counts...
              </p>
            </div>
          ) : groupsWithCount && groupsWithCount.length > 0 ? (
            groupsWithCount.map((group) => (
              <div
                key={group._id}
                className={`flex items-center ${isDark ? 'bg-[#464646] hover:bg-[#343437]' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg overflow-hidden transition cursor-pointer p-2`}
                onClick={() => handleSelectGroup(group)}
              >
                {/* Group Image */}
                <div className="flex-shrink-0">
                  <img
                    src={getImageUrl(group.company_logo)}
                    alt={group.name || group.group_name || 'Group'}
                    className="w-10 h-10 object-cover rounded-md"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/50';
                    }}
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 px-2 min-w-0">
                  <h3 className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {group.name || group.group_name}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {group.events_count || 0} {group.events_count === 1 ? 'event' : 'events'}
                  </p>
                </div>

                {/* Down Arrow in Square */}
                <div className="flex-shrink-0">
                  <div className={`w-5 h-5 flex items-center justify-center rounded-md ${isDark ? 'bg-[#2E2E2E]' : 'bg-gray-300'}`}>
                    <svg 
                      className={`w-3 h-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`text-center py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-xs">No groups available.</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className={`flex flex-col gap-2 p-3 ${isDark ? 'bg-[#1B1B1D]' : 'bg-gray-50'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={handleCreateNewGroup}
            className="w-full px-3 py-2 bg-[#363A3F] hover:bg-[#404448] text-white rounded-lg text-xs transition-colors"
          >
            Create new group
          </button>
          <button
            onClick={() => groupsWithCount && groupsWithCount.length > 0 && handleSelectGroup(groupsWithCount[0])}
            className="w-full px-3 py-2 bg-[rgba(30,18,66,1)] hover:bg-[rgba(25,15,55,1)] text-white rounded-lg text-xs transition-colors"
            disabled={!groupsWithCount || groupsWithCount.length === 0}
          >
            Create event
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSelectionModal;
