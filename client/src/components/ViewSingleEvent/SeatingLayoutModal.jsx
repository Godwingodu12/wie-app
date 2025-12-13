// components/ViewSingleEvent/SeatingLayoutModal.jsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Minus,
  Undo,
  Pencil,
  MapPin,
  Clock,
  Users,
  CalendarDays,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Card from "../../components/ViewSingleEvent/Card";
import dayjs from "dayjs";
import { getPostalDetailsFromCoords } from "../../services/ticketService";

const SeatingLayoutModal = ({
  eventData,
  theme,
  onClose,
  totalSeatingLayouts,
  currentSeatingIndex,
  onPrevSeating,
  onNextSeating,
  formatImagePath, // Assuming this is passed from ViewSingleEvent
}) => {
  if (!eventData) return null;

  // --- STATE FOR ZOOM AND PAN ---
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [geocodedDetails, setGeocodedDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchGeocode = async () => {
      const coords = eventData.exact_map_location; // Only fetch if it's offline and has coordinates

      if (
        eventData.location_type === "offline" &&
        typeof coords?.latitude === "number" &&
        typeof coords?.longitude === "number"
      ) {
        setIsLoadingDetails(true);
        try {
          const details = await getPostalDetailsFromCoords(
            coords.latitude,
            coords.longitude
          );
          setGeocodedDetails(details);
        } catch (error) {
          console.error("Error fetching geocoded details in modal:", error);
          setGeocodedDetails(null); // Clear on failure
        } finally {
          setIsLoadingDetails(false);
        }
      } else {
        setGeocodedDetails(null);
      }
    };

    fetchGeocode();
  }, [eventData]);

  // --- ZOOM HANDLERS ---
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 1.0)); // Don't zoom out beyond 100%
  const handleResetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const defaultLocation = {
    address: eventData.location || "Venue Address",
    pincode: eventData.pincode || (isLoadingDetails ? "Loading..." : "N/A"),
    country: eventData.country || (isLoadingDetails ? "Loading..." : "N/A"),
    locality:(isLoadingDetails ? "Loading..." : "N/A"),
  };

  const venueData = {
    name: eventData.venue || "Seminar Hall", 
    address: geocodedDetails?.formattedAddress || defaultLocation.address,
    pincode: geocodedDetails?.postalCode || defaultLocation.pincode,
    country: geocodedDetails?.country || defaultLocation.country,
    locality:geocodedDetails?.locality||defaultLocation.locality,
  };

  const subLocation = eventData.venue || "Venue Address";

  const eventDates = eventData.event_dates?.[0];
  const formattedDate = eventDates?.start_date
    ? dayjs(eventDates.start_date).format("MMM DD, YYYY")
    : "Date N/A";
  const formattedTime = eventDates?.start_time
    ? dayjs(`2000-01-01T${eventDates.start_time}`).format("hh:mm A")
    : "Time N/A";
  const dateTime = `${formattedDate} · ${formattedTime}`;

  const ticketPricing = eventData.ticket_types?.map((t) => ({
    label: t.ticket_type,
    price: t.ticket_price,
    color: t.color || "bg-gray-500",
  })) || [{ label: "Gold section", price: 2500, color: "bg-yellow-500" }];

  const showTimes = [
    { label: "Start Time", time: eventData.event_dates[0].start_time },
    { label: "End Time", time: eventData.event_dates[0].end_time },
  ];

  // CRITICAL: Get the Seating Layout Image Path
  const seatingLayoutPath = eventData.ticket_layout
    ? formatImagePath(eventData.ticket_layout)
    : "https://via.placeholder.com/800x600/3A2D5C/FFFFFF?text=No+Layout+Image";

  const bgColor = "#5E5CE6";
  const gradientBg =
    "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)";
  const textColor = theme.textColor;
  const insetBg = theme.insetBg;
  const cardBg = theme.cardBg;
  const themeOutsetShadow = theme.shadowOutset;
  const themeInsetShadow = theme.shadowInset;

  // Helper to render individual seats (Illustrative, using INSET shadow)

  // Helper to render the complex seating chart visualization (Image Container)
  const renderSeatingChart = () => (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <img
        src={seatingLayoutPath} // 👈 Dynamic image source
        alt="Seating Layout"
        className="max-w-full max-h-full object-contain"
        style={{
          // Apply zoom and pan transformation
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: "center center",
          transition: "transform 0.1s ease-out",
          userSelect: "none",
        }}
        // Placeholder pan functionality (can be enhanced with onMouseDown/onMouseMove)
        onMouseDown={(e) => {
          if (zoom > 1) {
            e.preventDefault();
            let startX = e.clientX - position.x;
            let startY = e.clientY - position.y;

            const onMouseMove = (moveEvent) => {
              setPosition({
                x: moveEvent.clientX - startX,
                y: moveEvent.clientY - startY,
              });
            };
            const onMouseUp = () => {
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            };
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          }
        }}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* --- CAROUSEL CHEVRONS (EXTERNAL) --- */}
      {totalSeatingLayouts > 1 && (
        <>
          {/* LEFT CHEVRON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevSeating();
            }}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 p-3 ml-2 rounded-full z-[101] transition-colors`}
            style={{ background: insetBg }}
          >
            <ChevronLeft size={28} className={textColor} />
          </button>

          {/* RIGHT CHEVRON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNextSeating();
            }}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 p-3 mr-2 rounded-full z-[101] transition-colors`}
            style={{ background: insetBg }}
          >
            <ChevronRight size={28} className={textColor} />
          </button>
        </>
      )}

      <div
        className={`w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-3xl relative flex flex-col p-6 custom-scrollbar`}
        style={{ backgroundColor: theme.mainBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          // Outer container: Flex row on MD+, stacks on mobile. Uses justify-between to push the two ends apart.
          className="flex flex-col md:flex-row justify-between items-center w-full p-2 rounded-2xl md:px-4 -mt-4 mb-6 space-y-3 md:space-y-0"
          style={{ backgroundColor: insetBg, boxShadow: themeOutsetShadow }}
        >
          {/* LEFT BLOCK: Back Button, Icon, Title (This group is the primary element on the left) */}
          <div className="md:flex items-center space-x-3 space-y-2 md:space-y-0 flex-shrink-0 w-full md:w-auto ">
            {/* Back Button */}
            <div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors flex-shrink-0`}
                style={{
                  backgroundColor: insetBg,
                  boxShadow: themeOutsetShadow,
                }}
              >
                <ArrowLeft size={20} className={textColor} />
              </button>
              <span
                className={`text-xl pl-4 md:hidden  font-semibold ${textColor} whitespace-nowrap truncate my-auto`}
              >
                Seating Layout
              </span>
            </div>

            {/* Main Seating Icon */}
            <div className="flex space-x-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bgColor }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-armchair"
                >
                  <path d="M18 10V9a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v1" />
                  <rect width="20" height="8" x="2" y="10" rx="2" />
                  <path d="M12 18V10" />
                  <path d="M17 18v-8" />
                  <path d="M7 18v-8" />
                </svg>
              </div>

              {/* Title */}
              <h2
                className={`text-xl flex  font-semibold ${textColor} whitespace-nowrap truncate my-auto`}
              >
                {eventData.event_name}{" "}
                <span className="hidden md:block pl-8">Seating Layout</span>
              </h2>
            </div>
          </div>

          {/* RIGHT BLOCK: Location Card & Date/Time Card (Stacks vertically on mobile, horizontally on MD+) */}
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 items-center w-full md:w-auto mt-3 md:mt-0">
            {/* Location Card (W-FULL on mobile) */}
            <Card
              theme={theme}
              className="flex flex-col items-start py-1 px-3 rounded-xl transition-colors w-full md:w-auto"
              customStyle={{
                boxShadow: themeInsetShadow,
                backgroundColor: cardBg,
              }}
            >
              <span
                className={`text-sm font-medium ${textColor} leading-tight`}
              >
                {venueData.locality}
              </span>
              <span className={`text-xs text-gray-400 leading-none`}>
                {subLocation}
              </span>
            </Card>

            {/* Date/Time Card (W-FULL on mobile) */}
            <Card
              theme={theme}
              className="flex items-center py-2 px-3 rounded-xl transition-colors w-full md:w-auto justify-center md:justify-start"
              customStyle={{
                boxShadow: themeInsetShadow,
                backgroundColor: cardBg,
              }}
            >
              <span className={`text-sm ${textColor} whitespace-nowrap`}>
                {dateTime}
              </span>
            </Card>
          </div>
        </div>

        {/* --- END TOP HEADER BAR --- */}
        {/* --- 2. MAIN CONTENT GRID CONTAINER (OUTSET SHADOW) --- */}
        <div
          className="w-full p-6 rounded-2xl"
          style={{ backgroundColor: cardBg, boxShadow: themeOutsetShadow }}
        >
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN (2/3 width): Seating Chart Area */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Title & Action Buttons Row (HORIZONTAL ALIGNMENT) */}
              <div className="flex justify-between items-center gap-4">
                {/* "Seminar Hall" Heading (Outset Shadow) */}
                <div
                  className="flex-grow p-4 rounded-xl flex items-center justify-center mr-auto"
                  style={{
                    backgroundColor: insetBg,
                    boxShadow: themeOutsetShadow,
                  }}
                >
                  <h3 className={`text-2xl font-bold ${textColor}`}>
                    {eventData.venue}
                    {/* Display counter if multiple layouts exist */}
                    {totalSeatingLayouts > 1 && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({currentSeatingIndex + 1} of {totalSeatingLayouts})
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              {/* Main Seating Layout Area (INSET Shadow) - The core viewing area */}
              <div
                className="flex-grow p-4 rounded-xl flex items-center h-56 justify-center overflow-hidden relative" // Padding reduced for visual fit
                style={{
                  backgroundColor: insetBg,
                  boxShadow: themeInsetShadow,
                }}
              >
                {renderSeatingChart()}
              </div>
            </div>

            {/* RIGHT COLUMN (1/3 width): Details Stack */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Four Action Buttons Group (Gradient Buttons) */}
              <Card
                theme={theme}
                className="flex items-center space-x-2 flex-shrink-0 justify-center"
              >
                {/* Individual Buttons (Applying Gradient and Outset Shadow to the button itself) */}
                <button
                  onClick={handleZoomIn}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
                  style={{
                    background: gradientBg,
                    boxShadow: themeOutsetShadow,
                  }}
                >
                  <Plus size={20} className="text-white" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
                  style={{
                    background: gradientBg,
                    boxShadow: themeOutsetShadow,
                  }}
                >
                  <Minus size={20} className="text-white" />
                </button>
                <button
                  onClick={handleResetView}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
                  style={{
                    background: gradientBg,
                    boxShadow: themeOutsetShadow,
                  }}
                >
                  <RotateCcw size={20} className="text-white" />
                </button>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
                  style={{
                    background: gradientBg,
                    boxShadow: themeOutsetShadow,
                  }}
                >
                  <Pencil size={20} className="text-white" />
                </button>
              </Card>

              {/* Ticket Pricing Card (OUTSET Shadow) */}
              <Card
                theme={theme}
                className="p-4 rounded-xl"
                customStyle={{
                  boxShadow: themeOutsetShadow,
                  backgroundColor: cardBg,
                }}
              >
                <h4 className={`text-lg font-semibold mb-4 ${textColor}`}>
                  Ticket Pricing
                </h4>
                <div className="max-h-[70px] overflow-y-auto space-y-2">
                  {ticketPricing.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            item.color || "bg-gray-500"
                          }`}
                        ></div>
                        <span className={`text-sm ${textColor}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${textColor}`}>
                        ₹ {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Venue Details Card (OUTSET Shadow) */}
              <Card
                theme={theme}
                className="p-4 rounded-xl"
                customStyle={{
                  boxShadow: themeOutsetShadow,
                  backgroundColor: cardBg,
                }}
              >
                <h4 className={`text-lg font-semibold mb-4 ${textColor}`}>
                  Venue
                </h4>
                <div className="max-h-[110px] overflow-y-auto p-1">
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className={`text-gray-400`}>Address</span>
                    <span className={`${textColor} text-right`}>
                      {venueData.address}
                    </span>
                    <span className={`text-gray-400`}>Pincode</span>
                    <span className={`${textColor} text-right`}>
                      {venueData.pincode}
                    </span>
                    <span className={`text-gray-400`}>Country</span>
                    <span className={`${textColor} text-right`}>
                      {venueData.country}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Show Time Card (OUTSET Shadow) */}
              <Card
                theme={theme}
                className="p-4 rounded-xl"
                customStyle={{
                  boxShadow: themeOutsetShadow,
                  backgroundColor: cardBg,
                }}
              >
                <h4 className={`text-lg font-semibold mb-4 ${textColor}`}>
                  Time
                </h4>
                <div className="max-h-[110px] overflow-y-auto">
                  {showTimes.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center mb-2"
                    >
                      <span className={`text-sm ${textColor}`}>
                        {item.label}
                      </span>
                      <span className={`text-sm font-medium ${textColor}`}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingLayoutModal;
