import React, { useState, useRef, useEffect } from "react";
import ZoomIn from "../../assets/Event/ZoomIn.svg";
import ZoomRest from "../../assets/Event/ZoomRest.svg";
import ZoomOut from "../../assets/Event/ZoomOut.svg";
const SeatingLayoutPreview = ({
  seatingLayout,
  onSeatSelect,
  darkMode = false,
  isExpandable = false,
  ticketTypeAssignments = [],
}) => {
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isExpanded) {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(false);
      }
    };

    // Add keyboard shortcuts for zoom
    const handleKeyboard = (e) => {
      if (isExpanded) {
        // Zoom in with + or =
        if ((e.key === "+" || e.key === "=") && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setScale((prev) => Math.min(prev + 0.2, 2));
        }
        // Zoom out with -
        if (e.key === "-" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setScale((prev) => Math.max(prev - 0.2, 0.5));
        }
        // Reset with 0
        if (e.key === "0" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setScale(1);
          setPosition({ x: 0, y: 0 });
        }
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleKeyboard);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("keydown", handleKeyboard);
        document.body.style.overflow = "unset";
      };
    }
  }, [isExpanded]);
  if (
    !seatingLayout ||
    !seatingLayout.seats ||
    seatingLayout.seats.length === 0
  ) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-sm">No seating layout available</p>
        <p className="text-xs mt-1">
          Upload a file and generate the layout first
        </p>
      </div>
    );
  }
  const { rows, columns, seats, layoutStyle, detectionMethod } = seatingLayout;
  const seatsByRow = rows.map((row) =>
    seats.filter((seat) => seat.row === row).sort((a, b) => a.column - b.column)
  );
  // Calculate optimal seat size based on container
  const maxSeatsInRow = Math.max(...seatsByRow.map((row) => row.length));
  const seatSize = Math.min(48, Math.floor(500 / maxSeatsInRow));
  const handleMouseDown = (e) => {
    if (e.target.classList.contains("draggable-area")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.min(Math.max(0.5, prev + delta), 2));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleSeatClick = (seat) => {
    const newSelected = new Set(selectedSeats);
    if (newSelected.has(seat.seatId)) {
      newSelected.delete(seat.seatId);
    } else {
      newSelected.clear(); // Single selection only
      newSelected.add(seat.seatId);
    }
    setSelectedSeats(newSelected);

    if (onSeatSelect) {
      onSeatSelect(
        Array.from(newSelected).map((id) => seats.find((s) => s.seatId === id))
      );
    }
  };
  const getSeatColor = (seat) => {
    // STEP 1: Check for saved color (from database or assignment)
    if (seat.ticketTypeColor) {
      return seat.ticketTypeColor;
    }

    // STEP 2: Fallback to assignments lookup
    if (
      seat.ticketTypeId &&
      ticketTypeAssignments &&
      ticketTypeAssignments.length > 0
    ) {
      const assignment = ticketTypeAssignments.find(
        (a) => String(a.ticketTypeId) === String(seat.ticketTypeId)
      );

      if (assignment && assignment.color) {
        return assignment.color;
      }
    }

    // STEP 3: Selection preview (only for interactive mode)
    if (selectedSeats.has(seat.seatId)) {
      return "#10B981"; // Green preview
    }

    // STEP 4: Unavailable state
    if (seat.isAvailable === false && !seat.ticketTypeId) {
      return "#EF4444"; // Red
    }
    // STEP 5: Default gray for truly unassigned seats
    return darkMode ? "#4B5563" : "#D1D5DB";
  };
  const content = (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${
        darkMode ? "bg-[#212426]" : "bg-[#FEFEFE]"
      } ${
        isExpanded
          ? "h-full rounded-none border-none"
          : "h-[500px] rounded-lg border-2 border-gray-300 dark:border-gray-700"
      }`}
      onWheel={handleWheel}
    >
      {/* Detection Info Badge */}
      {detectionMethod && (
        <div className="absolute top-2 left-2 z-20 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {detectionMethod === "pattern_recognition" &&
            "Auto-detected from image"}
          {detectionMethod === "text_recognition" && "Extracted via OCR"}
          {detectionMethod === "default" && "Generated layout"}
        </div>
      )}
      {/* Controls - Show in both normal and fullscreen modes */}
      <div
        className={`absolute p-2 rounded-[10px] ${
          darkMode
            ? "bg-[#ffffff] bg-opacity-20 text-[#FFFFFF]"
            : "bg-gray-400 bg-opacity-50 text-gray-800"
        } ${
          isExpanded
            ? "bottom-20 left-1/2 transform -translate-x-1/2"
            : "top-2 right-2"
        } z-20 flex gap-2`}
      >
        <button
          onClick={() => setScale((prev) => Math.min(prev + 0.2, 2))}
          className={`bg-white dark:bg-transparent p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 ${
            isExpanded ? "text-white bg-transparent " : ""
          }`}
          title="Zoom In (Ctrl + Scroll)"
        >
          <img src={ZoomIn} alt="" className={darkMode ? "" : "invert"} />
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.5))}
          className={`bg-white dark:bg-transparent p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 ${
            isExpanded ? "text-white bg-transparent " : ""
          }`}
          title="Zoom Out"
        >
          <img src={ZoomOut} alt="" className={darkMode ? "" : "invert"} />
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className={`bg-white dark:bg-transparent p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 ${
            isExpanded ? "text-white bg-transparent " : ""
          }`}
          title="Reset View"
        >
          <img src={ZoomRest} alt="" className={darkMode ? "" : "invert"} />
        </button>
        {/* Show zoom percentage in fullscreen */}
        {isExpanded && (
          <div
            className="bg-white dark:bg-transparent p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 ${
            isExpanded ? 'text-white bg-transparent ' : ''
          }"
          >
            <span className="text-xs font-semibold">
              {Math.round(scale * 100)}%
            </span>
          </div>
        )}
        {isExpandable && !isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded shadow-lg transition-colors"
            title="Open Fullscreen View"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Stage indicator */}
      <div className="absolute top-12 left-0 right-0 z-10">
        <div
          className={`text-center py-2 rounded-lg mb-4 mx-4 ${
            darkMode
              ? "bg-[#ffffff] bg-opacity-20 text-[#FFFFFF]"
              : "bg-gray-400 bg-opacity-50 text-gray-800"
          }`}
        >
          <div className="text-sm font-semibold tracking-wider">
            STAGE / SCREEN
          </div>{" "}
        </div>
      </div>
      {/* Seating area*/}
      <div className="absolute inset-0 overflow-auto pt-20 pb-24">
        <div
          className="draggable-area min-h-full p-6 flex flex-col items-center justify-start"
          onMouseDown={handleMouseDown}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center top",
            transition: isDragging ? "none" : "transform 0.2s ease",
          }}
        >
          <div className="space-y-2">
            {seatsByRow.map((rowSeats, rowIndex) => {
              const rowLabel = rows[rowIndex];
              const maxSeatsInLayout = Math.max(
                ...seatsByRow.map((r) => r.length)
              );
              const seatsInThisRow = rowSeats.length;

              // Detect if this is a shaped layout
              const isShapedLayout =
                layoutStyle &&
                [
                  "circular",
                  "oval-horizontal",
                  "oval-vertical",
                  "triangular-down",
                  "triangular-up",
                  "curved",
                  "image_detected",
                ].includes(layoutStyle);

              // Center offset for non-rectangular layouts
              const centerOffset = isShapedLayout
                ? `${
                    ((maxSeatsInLayout - seatsInThisRow) / 2) * (seatSize + 4)
                  }px`
                : "0px";

              return (
                <div key={rowLabel} className="flex items-center gap-3">
                  {/* Row label */}
                  <div
                    className="w-8 text-center font-bold text-gray-700 dark:text-gray-300 flex-shrink-0"
                    style={{ fontSize: `${Math.max(12, seatSize / 4)}px` }}
                  >
                    {rowLabel}
                  </div>

                  {/* Seats in this row */}
                  <div
                    className="flex gap-1"
                    style={{ marginLeft: centerOffset }}
                  >
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeats.has(seat.seatId);
                      const seatColor = getSeatColor(seat);

                      return (
                        <button
                          key={seat.seatId}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          className={`rounded text-xs font-semibold transition-all relative ${
                            isSelected
                              ? "ring-2 ring-white scale-105"
                              : "hover:scale-105"
                          } ${
                            !seat.isAvailable && !seat.ticketTypeColor
                              ? "opacity-40 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          style={{
                            width: `${seatSize}px`,
                            height: `${seatSize}px`,
                            backgroundColor: seatColor,
                            color: "#FFFFFF", // Always white text for visibility
                            border: seat.ticketTypeColor
                              ? "2px solid rgba(255,255,255,0.6)"
                              : "none",
                            boxShadow: seat.ticketTypeColor
                              ? "0 2px 6px rgba(0,0,0,0.3)"
                              : "none",
                          }}
                          title={`${seat.seatId}${
                            seat.ticketTypeName
                              ? ` - ${seat.ticketTypeName}`
                              : ""
                          }`}
                          disabled={!seat.isAvailable && !seat.ticketTypeColor}
                        >
                          <svg
                            className={`mx-auto ${
                              seatSize > 40 ? "w-6 h-6" : "w-4 h-4"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4 18v3h3v-3h10v3h3v-6H4v3zm15-8h3v3h-3v-3zM2 10h3v3H2v-3zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z" />
                          </svg>
                          {seat.ticketTypeColor && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                              <svg
                                className="w-2 h-2 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Legend with Color Assignments */}
      <div
        className={`absolute bottom-0 left-0 right-0  border-t border-gray-300 dark:border-gray-700 ${
          isExpanded ? "p-4" : "p-3"
        }`}
      >
        <div className="space-y-2">
          {/* Color Legend for Ticket Types - CENTERED */}
          {ticketTypeAssignments && ticketTypeAssignments.length > 0 && (
            <div className="flex gap-3 justify-center items-center flex-wrap pb-2 border-b border-gray-200 dark:border-gray-700">
              {ticketTypeAssignments.map((assignment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  <div
                    className="w-5 h-5 rounded border-2 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: assignment.color }}
                  ></div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {assignment.ticketTypeName}:{" "}
                    {assignment.assignedSeats?.length || 0}/
                    {assignment.capacity}
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Seat count info - CENTERED */}
          <div className="text-center text-xs text-gray-600 dark:text-gray-400 pt-1">
            {seats.length} seats • {rows.length} rows
            {layoutStyle &&
              layoutStyle !== "grid" &&
              ` • ${layoutStyle.replace("-", " ")}`}
          </div>
        </div>
      </div>
      {/* Selected seat info*/}
      {selectedSeats.size > 0 && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-20">
          <strong>Selected:</strong> {Array.from(selectedSeats).join(", ")}
        </div>
      )}
    </div>
  );
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
        <div className="w-full h-full relative">
          {/* Close button for fullscreen */}
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 z-[10000] bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg shadow-2xl transition-colors flex items-center gap-2"
            title="Exit Fullscreen (ESC)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="text-sm font-semibold">Exit Fullscreen</span>
          </button>
          {/* Content in fullscreen */}
          <div className="w-full h-full">{content}</div>
        </div>
      </div>
    );
  }
  return content;
};
export default SeatingLayoutPreview;
