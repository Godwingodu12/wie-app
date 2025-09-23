import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainImage from '../../assets/Event/main.png';

const GroupSelectionModal = ({ groups, isOpen, onClose, onSelectGroup, darkMode = true }) => {
  const navigate = useNavigate();

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
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className={`${darkMode ? 'bg-[#212426]' : 'bg-white'} rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-hidden shadow-2xl mx-2`}>
        
        {/* Header Image */}
        <div className="relative h-32 sm:h-40 md:h-48">
          <img
            src={MainImage}
            alt="Event Header"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-[rgba(103,103,103,1)] rounded-md hover:bg-[rgba(83,83,83,1)] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4 text-white"
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
        <div className="p-3 sm:p-4 md:p-6">
          <h2 className={`text-lg sm:text-xl md:text-2xl font-bold text-left ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Create a new event
          </h2>
          <p className={`mt-1 text-xs sm:text-sm text-left ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose from your existing groups to link with the event, or create a new group to get started.
          </p>
        </div>

        {/* Group List */}
        <div className="px-3 sm:px-4 md:px-6 space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[250px] md:max-h-[300px] overflow-y-auto">
          {groups && groups.length > 0 ? (
            groups.map((group) => (
              <div
                key={group._id}
                className={`flex items-center ${darkMode ? 'bg-[#464646] hover:bg-[#343437]' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl overflow-hidden transition cursor-pointer`}
                onClick={() => handleSelectGroup(group)}
              >
                {/* Group Image */}
                <div className="flex-shrink-0 p-2">
                  <img
                    src={group.company_logo || 'https://via.placeholder.com/100'}
                    alt={group.company_logo}
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-lg"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 px-2 sm:px-3 md:px-4 py-2 min-w-0">
                  <h3 className={`font-semibold text-xs sm:text-sm md:text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {group.name || group.group_name}
                  </h3>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {group.events_count || 0} event created
                  </p>
                </div>

                {/* Down Arrow in Square */}
                <div className="flex-shrink-0 pr-3">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md ${darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-300'}`}>
                    <svg 
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} 
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
            <div className={`text-center py-4 sm:py-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-sm">No groups available. Create a new group to get started.</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className={`flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 ${darkMode ? 'bg-[#1B1B1D]' : 'bg-gray-50'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={handleCreateNewGroup}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#363A3F] hover:bg-[#404448] text-white rounded-lg text-xs sm:text-sm transition-colors order-2 sm:order-1"
          >
            Create new group
          </button>
          <button
            onClick={() => groups && groups.length > 0 && handleSelectGroup(groups[0])}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[rgba(30,18,66,1)] hover:bg-[rgba(25,15,55,1)] text-white rounded-lg text-xs sm:text-sm transition-colors order-1 sm:order-2"
          >
            Create event
          </button>
        </div>
      </div>
    </div>
  );
};
export default GroupSelectionModal;