import { Link } from "react-router-dom";
import formatImagePath from "../ViewSingleEvent/formatImagePath";

const LiveEventCarouselCard = ({
  event,
  isDark,
  theme,
  outerShadow,
  combinedShadow,
}) => {
  // --- Determine Data & Styles ---
  const eventName = event.event_name || "Event Name Missing";
  const eventSubcategory = event.event_subcategory || "Category";

  const eventLogoPath = event.event_logo || event.event_banner;
  const logoUrl = eventLogoPath ? formatImagePath(eventLogoPath) : null;

  const cardBgDark = "#212426"; // Exact card background
  const cardBackgroundColor = isDark ? cardBgDark : theme.cardBg;
  const textColor = isDark ? "text-white" : "text-gray-800";
  const subTextColor = isDark ? "text-gray-400" : "text-gray-500";

  // Card style with outer shadow
  const cardStyle = {
    ...outerShadow,
    backgroundColor: cardBackgroundColor,
    borderRadius: "32px",
  };

  // Button style with exact gradient
  const buttonStyle = {
    background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
    color: "white",
    transition: "all 0.3s ease",
    padding: "0.6rem 0",
    boxShadow: "0 4px 12px rgba(101, 73, 184, 0.3)",
  };

  return (
    <div className="w-full">
      <div
        className="rounded-[32px] py-5 px-4 flex flex-col items-center transition-all duration-300 mx-auto"
        style={{
          ...cardStyle,
          minHeight: "260px",
          maxWidth: "200px",
        }}
      >
        {/* 1. Logo/Image (Top Center) */}
        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 6px 20px rgba(0, 0, 0, 0.7)" }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${eventName} Logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-normal text-white/60">logo</span>
            )}
          </div>
        </div>

        {/* 2. Event Name and Subtitle (Center) */}
        <div className="flex flex-col items-center justify-center text-center mb-5 flex-grow">
          <h4
            className={`font-semibold text-[15px] ${textColor} leading-tight mb-0.5 px-1`}
          >
            {eventName}
          </h4>
          <p className={`text-[13px] ${subTextColor} leading-tight mt-0.5`}>
            {eventSubcategory}
          </p>
        </div>

        {/* 3. View Button (Bottom) */}
        <Link
          to={`/ticket/view-single-event/${event._id}`}
          className="w-full text-center text-[13px] font-semibold rounded-full py-2 block hover:opacity-90 transition-opacity"
          style={buttonStyle}
        >
          View
        </Link>
      </div>
    </div>
  );
};

export default LiveEventCarouselCard;
