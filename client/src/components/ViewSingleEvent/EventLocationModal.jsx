import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import Card from "./Card";


import DirectionSubEvent from "../../assets/ViewSingleEvent/DirectionSubEvent.svg";
import ShareSubEvent from "../../assets/ViewSingleEvent/ShareSubEvent.svg";
import SaveSubEvent from "../../assets/ViewSingleEvent/SaveSubEvent.svg";

const EventLocationModal = ({ eventData, theme, onClose, setAppAlert }) => {
    // --- Data Derivation ---
  const coords = eventData.exact_map_location || {};
  const hasLocation = coords.latitude && coords.longitude;
  if (!hasLocation) {
    setAppAlert({
      message: "Location Missing",
      description: "Exact map coordinates are not available for directions.",
      type: "error",
      show: true,
    });
    return;
  }

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isApiReady, setIsApiReady] = useState(false);



  const initialCenter = {
    lat: parseFloat(coords.latitude) || 10.5276,
    lng: parseFloat(coords.longitude) || 76.2144,
  };

  const formattedDate = eventData.event_dates?.[0]?.start_date
    ? new Date(eventData.event_dates[0].start_date).toLocaleDateString(
        "en-US",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      )
    : "N/A";
  const formattedTime = eventData.event_dates?.[0]?.start_time
    ? new Date(
        `1970-01-01T${eventData.event_dates[0].start_time}`
      ).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    : "N/A";

  // --- Styling Variables ---
  const textColor = theme.textColor;
  const gradientBg =
    "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)";

  // --- FUNCTIONAL HANDLERS (Same as previous step) ---
  const handleGetDirections = () => {
    if (!hasLocation) {
      setAppAlert({
        message: "Location Missing",
        description: "Location details are incomplete for sharing.",
        type: "error",
        show: true,
      });
      return;
    }
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${initialCenter.lat},${initialCenter.lng}`;
    window.open(mapsUrl, "_blank");
  };

  const handleShareLocation = () => {
    if (!hasLocation) {
      setAppAlert({
        message: "Location Missing",
        description: "Location details are incomplete for sharing.",
        type: "error",
        show: true,
      });
      return;
    }

    const mapsUrl = `https://www.google.com/maps/place/${
      eventData.venue || eventData.location
    }/@${initialCenter.lat},${initialCenter.lng},15z`;

    const shareData = {
      title: `Event Location: ${eventData.venue || eventData.location}`,
      text: `Check out the location for the ${eventData.name || "event"}!`,
      url: mapsUrl,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .catch((error) => console.error("Error sharing:", error));
    } else {
      navigator.clipboard
        .writeText(mapsUrl)
        .then(() =>
          setAppAlert({
            message: "Link Copied!",
            description: "The location link has been copied to your clipboard.",
            type: "success",
            show: true,
          })
        )
        .catch(() =>
          setAppAlert({
            message: "Copy Failed",
            description: "Could not copy the location link.",
            type: "error",
            show: true,
          })
        );
    }
  };

  const handleSaveLocation = () => {
    setAppAlert({
      message: "Coming Soon",
      description: "Save functionality is not yet implemented.",
      type: "error",
      show: true,
    });
  };

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (
      !isApiReady ||
      !mapRef.current ||
      !hasLocation ||
      !window.google ||
      !window.google.maps
    )
      return;

    const initializeMap = () => {
      if (!window.google || !window.google.maps) return;
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
      });

      markerRef.current = new window.google.maps.Marker({
        position: initialCenter,
        map: mapInstance,
        draggable: false,
        title: eventData.venue || "Event Location",
      });

      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, "resize");
        mapInstance.setCenter(initialCenter);
      }, 100);
    };

    initializeMap();
  }, [isApiReady, eventData, hasLocation]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl p-6 rounded-3xl relative flex flex-col space-y-4 max-h-[95vh] overflow-y-auto`}
        style={{
          backgroundColor: theme.mainBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-4 mb-2">
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors`}
            style={{
              backgroundColor: theme.isDark ? theme.insetBg : theme.cardBg,
              boxShadow: theme.shadowInset,
            }}
          >
            <ArrowLeft size={20} className={textColor} />
          </button>
          <h2 className={`text-xl font-semibold ${textColor}`}>
            Event Location - {eventData.location}
          </h2>
        </div>

        {/* 1. Map Display Area (Remains the same - map scales naturally with w-full) */}
        <Card
          theme={theme}
          className="w-full relative overflow-hidden rounded-xl"
        >
          <div
            ref={mapRef}
            className="w-full h-80 md:h-96" // Responsive height adjustment
            style={{
              backgroundColor: theme.isDark ? "#333" : "#eee",
              boxShadow: theme.shadowInset,
            }}
          >
            {!hasLocation && (
              <div className="w-full h-full flex items-center justify-center text-center">
                <p className={textColor}>Map location not specified.</p>
              </div>
            )}
          </div>
        </Card>

        {/* 2. Location Details & Actions */}
        {/* MODIFIED: Changed layout to stack on mobile (flex-col) and use space-y for padding */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0">
          {/* Left Panel: Address Details (Always takes full width) */}
          <div className="space-y-3 flex-grow w-full md:w-auto">
            <p className={`text-sm ${textColor}`}>
              <span className="font-bold">Address : </span>
              {eventData.venue || "Hilltop Road, Meppadi, Wayanad, Kerala"}
            </p>
            <p className={`text-sm ${textColor}`}>
              <span className="font-bold">Pincode : </span>
              {eventData.pincode || "673577"}
            </p>
            <p className={`text-sm ${textColor}`}>
              <span className="font-bold">Country : </span>
              {eventData.country || "India"}
            </p>
            <p className={`text-sm ${textColor}`}>
              <span className="font-bold">Coordinates : </span>
              {initialCenter.lat.toFixed(4)}° N, {initialCenter.lng.toFixed(4)}°
              E
            </p>
            <p className={`text-sm ${textColor}`}>
              <span className="font-bold">Date & Time : </span>
              {formattedDate} at {formattedTime}
            </p>
          </div>

          {/* Right Panel: Action Buttons (Aligned to the right on MD, full width on SM) */}
          {/* Uses justify-end to push buttons to the right on small screens */}
          <div className="w-full md:w-auto flex justify-end space-x-6 mt-4 flex-shrink-0">
            {/* Get Direction */}
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={handleGetDirections}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: gradientBg,
                  boxShadow: theme.shadowOutset,
                }}
              >
                <img
                  src={DirectionSubEvent}
                  alt="Direction"
                  className="w-5 h-5"
                />
              </div>
              <span className="text-xs mt-1 text-gray-400">Get direction</span>
            </div>

            {/* Share */}
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={handleShareLocation}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: gradientBg,
                  boxShadow: theme.shadowOutset,
                }}
              >
                <img src={ShareSubEvent} alt="Share" className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1 text-gray-400">Share</span>
            </div>

            {/* Save */}
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={handleSaveLocation}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: gradientBg,
                  boxShadow: theme.shadowOutset,
                }}
              >
                <img src={SaveSubEvent} alt="Save" className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1 text-gray-400">Save</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EventLocationModal;