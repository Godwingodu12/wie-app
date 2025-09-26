// client/src/components/modals/ExtraEventsPlanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExtraEventsPlanner = ({ isOpen, onYes, onNo, ticketId }) => {
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const handleYesClick = () => {    
    if (!ticketId) {
      console.error('ExtraEventsPlanner: ticketId is undefined!');
      alert('Error: Ticket ID is missing. Please try again.');
      return;
    }

    if (onYes) {
      onYes(); // Call the original onYes callback if provided
    }
    
    // Navigate to ticket addons page with ticketId
    const targetUrl = `/ticket/update-ticket-addons/${ticketId}`;
    console.log('ExtraEventsPlanner: Navigating to:', targetUrl);
    navigate(targetUrl);
  };

  const handleNoClick = () => {    
    if (!ticketId) {
      console.error('ExtraEventsPlanner: ticketId is undefined!');
      alert('Error: Ticket ID is missing. Please try again.');
      return;
    }

    if (onNo) {
      onNo(); // Call the original onNo callback if provided
    }
    
    // Navigate to ticket details page with ticketId
    const targetUrl = `/ticket/update-ticket-details/${ticketId}`;
    console.log('ExtraEventsPlanner: Navigating to:', targetUrl);
    navigate(targetUrl);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
    >
      <div 
        style={{ backgroundColor: '#262628' }} // Applied your main background color
        className="rounded-xl shadow-2xl w-full max-w-md mx-auto p-8 text-center"
      >

        {/* Icon container with your specified color */}
        <div 
          style={{ backgroundColor: '#1E1242' }} // Applied your icon background color
          className="mb-6 mx-auto w-24 h-24 rounded-full flex items-center justify-center"
        >
          {/* Using a generic placeholder icon */}
          <svg className="w-12 h-12 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-3xl font-semibold text-gray-100 mb-4">Any extra events planned?</h2>
        <p className="text-gray-400 mb-8 leading-relaxed text-sm px-4">
          Let us know if your main event includes additional sessions, workshops, or side events.
        </p>
        
        {/* Buttons with your specified colors */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleNoClick}
            disabled={!ticketId}
            style={{ 
              backgroundColor: !ticketId ? '#444' : '#363A3F',
              opacity: !ticketId ? 0.5 : 1,
              cursor: !ticketId ? 'not-allowed' : 'pointer'
            }}
            className="flex-1 px-6 py-3 text-gray-100 rounded-lg text-lg font-medium hover:opacity-80 transition-opacity"
          >
            No
          </button>
          <button
            onClick={handleYesClick}
            disabled={!ticketId}
            style={{ 
              backgroundColor: !ticketId ? '#444' : '#1E1242',
              opacity: !ticketId ? 0.5 : 1,
              cursor: !ticketId ? 'not-allowed' : 'pointer'
            }}
            className="flex-1 px-6 py-3 text-white rounded-lg text-lg font-medium hover:opacity-80 transition-opacity"
          >
            Yes
          </button>
        </div>

        {/* Show error message if ticketId is missing */}
        {!ticketId && (
          <p className="text-red-400 text-sm mt-4">
            Error: Ticket ID is missing. Please refresh the page and try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExtraEventsPlanner;
