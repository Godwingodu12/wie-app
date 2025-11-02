import { X, Tag, Image, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import Card from "./Card";

const TicketDetailModal = ({
  theme,
  onClose,
  ticketTypes,
  currentTicketIndex,
  onPrevTicket,
  onNextTicket,
  formatImagePath,
}) => {
  if (!ticketTypes || ticketTypes.length === 0) return null;

  const currentTicket = ticketTypes[currentTicketIndex];

  // CORRECTED: Using schema properties ticket_photo and ticket_price
  const ticketImageUrl = currentTicket.ticket_photo
    ? formatImagePath(currentTicket.ticket_photo)
    : null;
  const ticketPrice = currentTicket.ticket_price; // Use the correct price property

  const isSingleTicket = ticketTypes.length <= 1;

  // Use theme properties for background colors and text
  const modalBg = theme.mainBg;
  const cardBg = theme.cardBg;
  const textColor = theme.textColor;

  // Determine the ticket indicator color (defaulting to the ticket's color)
  const indicatorColor = currentTicket.color || "#FBBF24"; // Default to amber/gold
  const priceColor = theme.isDark ? "text-green-400" : "text-green-600";

  return (
    <div
      // Modal Overlay
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        // Modal Container: Narrow and vertically spaced
        className={`w-full max-w-lg p-6 rounded-3xl relative flex flex-col items-center space-y-6`}
        style={{
          backgroundColor: modalBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Card (Ticket Name & Close Button) */}
        <Card
          theme={theme}
          className="w-full p-3 flex items-center justify-between rounded-xl"
          customStyle={{
            boxShadow: theme.shadowOutset,
            backgroundColor: cardBg,
          }}
        >
          <div className="flex items-center space-x-3">
            {/* Ticket Color Indicator Circle/Icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: indicatorColor,
                boxShadow: theme.shadowOutset,
              }}
            >
              <Tag size={20} className="text-white" />
            </div>
            <h2 className={`text-lg font-semibold ${textColor}`}>
              {currentTicket.ticket_type || "Standard Ticket"}
            </h2>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors`}
            style={{
              backgroundColor: theme.isDark ? theme.insetBg : theme.cardBg,
              boxShadow: theme.shadowInset,
            }}
          >
            <X size={20} className={textColor} />
          </button>
        </Card>

        {/* 2. Price and Image Carousel Navigation Container */}
        <div className="w-full flex items-center justify-between space-x-4">
          {/* Left Chevron */}
          <button
            onClick={onPrevTicket}
            disabled={isSingleTicket}
            className={`p-3 rounded-full transition-colors ${
              isSingleTicket
                ? "opacity-30 cursor-default"
                : theme.isDark
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            style={{ boxShadow: isSingleTicket ? "none" : theme.shadowOutset }}
          >
            <ChevronLeft size={20} className={textColor} />
          </button>

          {/* Price & Image Display Column */}
          <div className="flex flex-col items-center space-y-4 flex-grow">
            {/* Ticket Price Section */}
            <div className="w-full text-center">
              <div className="flex items-center justify-center mb-1 space-x-2">
                <Tag size={16} className={textColor} />
                <span className={`text-sm ${textColor}`}>Ticket Price</span>
              </div>
              <h3 className={`text-4xl font-bold ${priceColor}`}>
                {/* CORRECTED: Displaying ticketPrice */}₹{ticketPrice || "0"}
              </h3>
            </div>

            {/* Ticket Image Preview */}
            <div className="flex  space-x-2 mb-3">
              <Image size={20} className={textColor} />
              <span className={`text-sm ${textColor}`}>Ticket image</span>
            </div>
            <Card
              theme={theme}
              className="w-full p-4 rounded-xl flex flex-col items-center justify-center min-h-[150px]"
            >
              {ticketImageUrl ? (
                <img
                  src={ticketImageUrl}
                  alt={`Preview of ${currentTicket.ticket_type}`}
                  className="w-full max-h-[200px] object-cover rounded-md shadow-lg"
                />
              ) : (
                <div
                  className={`text-center py-4 ${
                    theme.isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  <p>No image preview available.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Chevron */}
          <button
            onClick={onNextTicket}
            disabled={isSingleTicket}
            className={`p-3 rounded-full transition-colors ${
              isSingleTicket
                ? "opacity-30 cursor-default"
                : theme.isDark
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            style={{ boxShadow: isSingleTicket ? "none" : theme.shadowOutset }}
          >
            <ChevronRight size={20} className={textColor} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
