"use client";
import {
  createBooking,
  toggleLike,
  toggleSave,
  unlikeEvent,
  unsaveEvent,
  shareEvent,
  getEventStats,
  recordView,
  registerFreeEvent,
  verifyPayment,
  checkUserBooking,
} from "@/services/transactionService";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/home/ThemeContext";
import { Card } from "@/components/ui/Card";
import { getAllEventsWithDistance, getEventById, getGroupById } from "@/services/ticketUserService";
import {
  Event,
  SubEvent,
  ParentEventSummary,
  Group,
} from "@/types/ticket";
import { Alert } from "@/components/events/Alert";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  User,
  Phone,
  Mail,
  Tag,
  Info,
  ShoppingCart,
  Heart,
} from "lucide-react";
declare global {
  interface Window {
    Razorpay: any;
  }
}
import BackIcon from "@/assets/Event/BackIcon.svg";
import BookTicketIcon from "@/assets/Event/BookTicketIcon.svg";

import PublicIcon from "@/assets/Event/PublicIcon.svg";
import ShareIcon from "@/assets/Event/ShareIcon.svg";
import TicketIcon from "@/assets/Event/TicketIcon.svg";
import WishListIcon from "@/assets/Event/WishListIcon.svg";
import LocationIcon from "@/assets/Event/LocationIcon.svg";
import CalendarIcon from "@/assets/Event/CalenderIcon.svg";
import FreeOrPaidIcon from "@/assets/Event/FreeOrPaidIcon.svg";
import PetIcon from "@/assets/Event/PetIcon.svg";
import KidIcon from "@/assets/Event/KidIcon.svg";
import InstagramIcon from "@/assets/Event/InstagramIcon.svg";
import YoutubeIcon from "@/assets/Event/YoutubeIcon.svg";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { SimilarEvents } from "@/components/events/SimilarEvents";
import { BookingModal } from "@/components/events/BookingModal";
import { SubEventGrid } from "@/components/events/SubEventGrid";

export default function EventDetailPage() {
  useAuth(true);
  const params = useParams();
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles, isDark } = useTheme();
  const ticketApiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5005/api";
  const eventId =
    typeof params?.eventId === "string" ? params.eventId : undefined;
  const [event, setEvent] = useState<Event | SubEvent | null>(null);
  const [isSubEvent, setIsSubEvent] = useState(false);
  const [parentEvent, setParentEvent] = useState<ParentEventSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullGuidelines, setShowFullGuidelines] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [eventStats, setEventStats] = useState<any>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [userSaved, setUserSaved] = useState(false);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isViewTicketMode, setIsViewTicketMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [hasBooked, setHasBooked] = useState(false);
  const [userBooking, setUserBooking] = useState<any>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const isMainEvent = (event: Event | SubEvent): event is Event =>
    "sub_events" in event;
  const [activeSection, setActiveSection] = useState<
    "about" | "details" | "guests" | "photos" | "hashtags" | "additional"
  >("about");
  const hasAdditionalInfo = Boolean(
    event?.POCS?.length ||
    event?.prohibited_items?.length ||
    event?.kids_friendly ||
    event?.pet_friendly ||
    event?.event_instagram_link ||
    event?.event_youtube_link,
  );

  const SECTIONS: {
    key: "about" | "details" | "guests" | "photos" | "hashtags" | "additional";
    label: string;
    width: number;
  }[] = [
    { key: "about", label: "About", width: 116 },
    { key: "details", label: "Dates & Location", width: 211 },
    ...(event?.guests?.length
      ? [
          {
            key: "guests" as const,
            label: `Guests(${event.guests.length})`,
            width: 149,
          },
        ]
      : []),
    ...(event?.event_images?.length
      ? [
          {
            key: "photos" as const,
            label: `Photos(${event.event_images.length})`,
            width: 158,
          },
        ]
      : []),
    ...(event?.hashtag?.length
      ? [{ key: "hashtags" as const, label: "Hashtags", width: 146 }]
      : []),
    ...(hasAdditionalInfo
      ? [{ key: "additional" as const, label: "Additional Info", width: 188 }]
      : []),
  ];

  const normalizeStats = (stats: any) => ({
    like: stats?.like ?? stats?.likes ?? 0,
    share: stats?.share ?? stats?.shares ?? 0,
    totalBookings: stats?.totalBookings ?? stats?.total_bookings ?? 0,
    totalTicketsSold: stats?.totalTicketsSold ?? stats?.total_tickets_sold ?? 0,
    views: stats?.views ?? stats?.view ?? 0,
    saves: stats?.saves ?? stats?.save ?? 0,
    ...stats,
  });

  const getApiErrorMessage = (err: any, fallback: string) => {
    if (err?.code === "ERR_NETWORK") {
      return "Could not connect to the event services. Please make sure backend services are running.";
    }
    return err?.response?.data?.message || err?.message || fallback;
  };

  useEffect(() => {
    if (!event) return;
    if (isMainEvent(event)) {
      console.log("Event loaded with sub-events:", event.sub_events?.length || 0);
      return;
    }
    console.log("Sub-event loaded");
  }, [event]);
  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  // Record view after details are loaded
  useEffect(() => {
    if (eventId && !loading) {
      recordView(eventId as string).catch(console.error);
    }
  }, [eventId, loading]);

  useEffect(() => {
    if (eventId) {
      loadEventStats();
    }
  }, [eventId]);

  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!eventId) return;
      try {
        const result = await checkUserBooking(eventId);
        setHasBooked(result.hasBooked);
        setUserBooking(result.booking);
      } catch (error) {
        console.error("Error checking booking status:", error);
      }
    };

    if (event) {
      checkBookingStatus();
    }
  }, [eventId, event]);

  const loadEventStats = async () => {
    try {
      const statsData = await getEventStats(eventId as string);
      const stats = statsData?.data?.stats || {};
      const interactions = statsData?.data?.userInteractions || {};
      setEventStats(normalizeStats(stats));
      setUserLiked(interactions.liked ?? false);
      setUserSaved(interactions.saved ?? false);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      setEventStats((prev: any) => normalizeStats(prev || {}));
    }
  };
  const handleLike = async () => {
    const wasLiked = userLiked;
    // Optimistic update
    setUserLiked(!wasLiked);
    setEventStats((prev: any) => ({
      ...prev,
      like: Math.max(0, (prev?.like ?? 0) + (wasLiked ? -1 : 1)),
    }));
    try {
      if (wasLiked) {
        await unlikeEvent(eventId as string);
      } else {
        await toggleLike(eventId as string);
      }
      loadEventStats();
    } catch (error: any) {
      // Revert on failure
      setUserLiked(wasLiked);
      setEventStats((prev: any) => ({
        ...prev,
        like: Math.max(0, (prev?.like ?? 0) + (wasLiked ? 1 : -1)),
      }));
      console.error("Failed to toggle like:", error);
    }
  };

  const handleSave = async () => {
    const wasSaved = userSaved;
    setUserSaved(!wasSaved);
    try {
      if (wasSaved) {
        await unsaveEvent(eventId as string);
      } else {
        await toggleSave(eventId as string);
      }
      loadEventStats();
    } catch (error: any) {
      // Revert on failure
      setUserSaved(wasSaved);
      console.error("Failed to toggle save:", error);
    }
  };
  const hasEventStarted = () => {
    if (!event?.event_dates?.length) return false;

    const now = new Date();
    const start = new Date(event.event_dates[0].start_date);

    return now >= start;
  };

  const isOnlineOrRecorded =
    event?.location_type === "online" || event?.location_type === "recorded";

  const actionLabel = isOnlineOrRecorded
    ? hasEventStarted()
      ? "Watch Now"
      : "Notify Me"
    : "Book Tickets";

  const handleShare = async (method: string) => {
    try {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/events/${eventId}`
          : "";

      if (shareUrl) {
        const encodedUrl = encodeURIComponent(shareUrl);
        const message = encodeURIComponent(
          `Check out this event: ${event?.event_name || "Event"}`,
        );

        switch (method) {
          case "native":
            if (navigator.share) {
              await navigator.share({
                title: event?.event_name || "Event",
                text: message,
                url: shareUrl,
              });
            }
            break;
          case "whatsapp":
            window.open(
              `https://wa.me/?text=${message}%20${encodedUrl}`,
              "_blank",
            );
            break;
          case "facebook":
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
              "_blank",
            );
            break;
          case "twitter":
            window.open(
              `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${message}`,
              "_blank",
            );
            break;
          default:
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(shareUrl);
              alert("Link copied to clipboard");
            }
            break;
        }
      }

      await shareEvent(eventId as string, method);
      setShowShareOptions(false);
      loadEventStats();
    } catch (error: any) {
      console.error("Failed to share:", error);
    }
  };

  const initiateBooking = async () => {
    if (!selectedTicketType) {
      alert("Please select a ticket type");
      return;
    }

    setIsBooking(true);

    try {
      // Create booking
      const bookingResponse = await createBooking({
        ticketId: eventId as string,
        ticketTypeId: selectedTicketType,
        quantity,
      });

      const { booking, razorpayOrder, razorpayKeyId } = bookingResponse.data;

      // Initialize Razorpay payment
      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: event?.event_name || "Event Booking",
        description: `Booking for ${event?.event_name}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // ✅ Verify payment using transaction service directly
            const verifyData = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyData.success) {
              setShowSuccessModal(true);
              setShowBookingModal(false);

              // Refresh booking status for free events
              if (event?.payment_type === "free") {
                setHasBooked(true);
                setUserBooking(verifyData.data.booking);
              }
              loadEventStats();

              // Optional: Navigate to booking details after a delay
              setTimeout(() => {
                router.push(`/bookings/${verifyData.data.booking.id}`);
              }, 2000);
            } else {
              setAlertMessage(
                "Payment verification failed. Please contact support.",
              );
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            const errorMsg =
              error.response?.data?.message || "Payment verification failed";
            setAlertMessage(errorMsg);
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#5E5CE6",
        },
        modal: {
          ondismiss: function () {
            setIsBooking(false);
            setShowBookingModal(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Booking error:", error);
      alert(error.response?.data?.message || "Failed to create booking");
      setIsBooking(false);
    }
  };
  useEffect(() => {
    const activeState = { value: true };
    const run = async () => {
      await loadEventDetails(activeState);
    };
    run();
    return () => {
      activeState.value = false;
    };
  }, [eventId]);

  const loadEventDetails = async (activeState = { value: true }) => {
    if (!eventId) {
      if (activeState.value) {
        setError("Missing event id in URL");
        setLoading(false);
      }
      return;
    }
    try {
      if (activeState.value) {
        setLoading(true);
        setError(null);
      }
      let response: any;
      try {
        const timeoutError = new Error("timeout");
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(timeoutError), 8000); // 8 seconds timeout
        });
        response = await Promise.race([
          getEventById(eventId),
          timeoutPromise,
        ]);
      } catch (err: any) {
        // Fallback: fetch all events and find the specific one
        const fallbackResponse: any = await getAllEventsWithDistance();
        const eventsList = fallbackResponse?.data?.events || fallbackResponse?.data?.data || [];
        const foundEvent = eventsList.find((e: any) => String(e._id) === String(eventId) || String(e.id) === String(eventId));

        if (foundEvent) {
          response = { data: { event: foundEvent, isSubEvent: false, parentEvent: null } };
        } else {
          throw new Error(`Event API timed out or event not found. Please ensure the ticket service is reachable at ${ticketApiBaseUrl}.`);
        }
      }

      if (!activeState.value) return;
      setEvent(response?.data?.event ?? null);
      setIsSubEvent(Boolean(response?.data?.isSubEvent));
      setParentEvent(response?.data?.parentEvent ?? null);

      // Fetch group details if groupId is present
      const eventData = response?.data?.event;
      if (eventData?.groupId) {
        try {
          const groupResponse = await getGroupById(eventData.groupId);
          if (groupResponse.success && groupResponse.data) {
            const gData = groupResponse.data as any;
            setGroup({
              ...gData,
              group_name: gData.group_name || gData.name
            });
          }
        } catch (groupErr) {
          console.error("Failed to fetch group details:", groupErr);
        }
      }
    } catch (err: any) {
      if (!activeState.value) return;
      setError(getApiErrorMessage(err, "Failed to load event details"));
      console.error(err);
    } finally {
      if (activeState.value) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const response = await getAllEventsWithDistance();
        setAllEvents(response?.data?.events || []);
      } catch (err: any) {
        console.error("Failed to fetch events", err);
        setAllEvents([]);
      }
    };

    fetchAllEvents();
  }, []);

  useEffect(() => {
    const checkBooking = async () => {
      if (!eventId) return;
      try {
        const response = await checkUserBooking(eventId as string);
        if (response.success && response.data?.booking) {
          setHasBooked(true);
          setUserBooking(response.data.booking);
        }
      } catch (err: any) {
        console.error("Failed to check booking status", err);
      }
    };

    checkBooking();
  }, [eventId]);

  const handleBookEvent = () => {
    const isOnlineOrRecorded =
      event?.location_type === "online" || event?.location_type === "recorded";

    if (isOnlineOrRecorded) {
      if (hasEventStarted()) {
        // WATCH FLOW
        router.push(`/events/${eventId}/watch`);
      } else {
        // NOTIFY FLOW
        alert("You will be notified when the event starts");
        // TODO: call notify-me API
      }
      return;
    }

    if (!event?.ticket_types?.length && !event?.seating_layout) {
      alert("No tickets available for this event");
      return;
    }

    if (event?.seating_layout) {
      router.push(`/events/${eventId}/seating`);
      return;
    }

    if (!selectedTicketType && event.ticket_types && event.ticket_types.length > 0) {
      setSelectedTicketType(event.ticket_types[0]._id);
    }

    setIsViewTicketMode(false);
    setShowBookingModal(true);
  };

  const handleFreeRegistration = async () => {
    setIsBooking(true);
    try {
      const data = await registerFreeEvent(eventId as string, quantity);

      if (data.success) {
        setShowSuccessModal(true);
        setShowBookingModal(false);
        setHasBooked(true); // ✅ Update status
        setUserBooking(data.data.booking); // ✅ Store booking
        loadEventStats();
      } else {
        setAlertMessage(data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Free registration error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to register for event";
      setAlertMessage(errorMsg);
    } finally {
      setIsBooking(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push("/events/nearby");
    }
  };


  const likeCount = eventStats?.like ?? eventStats?.likes ?? 0;
  const shareCount = eventStats?.share ?? eventStats?.shares ?? 0;
  const bookingCount = eventStats?.totalBookings ?? 0;
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: themeStyles.background }}
      >
        <Loader2
          className="w-12 h-12 animate-spin"
          style={{ color: themeStyles.text }}
        />
      </div>
    );
  }
  if (error || !event) {
    return (
      <div
        className="min-h-screen py-8"
        style={{ backgroundColor: themeStyles.background }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card
            className="p-8 text-center"
            style={{
              background: themeStyles.cardBg,
              borderColor: themeStyles.border,
            }}
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
              Event Not Found
            </h2>
            <p className="mb-6 opacity-60" style={{ color: themeStyles.text }}>
              {error || "The event you are looking for does not exist."}
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: "#8860D9" }}
            >
              Go Back
            </button>
          </Card>
        </div>
      </div>
    );
  }
  const currentCategory =
    event?.event_category || (event as any)?.parentEventCategory || parentEvent?.event_category || null;

  const similarEvents = allEvents.filter((e) => {
    // Get category from event_category or parentEventCategory
    const eCategory = e.event_category || (e as any).parentEventCategory;
    if (!currentCategory || !eCategory) return false;

    return (
      eCategory.toLowerCase().trim() ===
        currentCategory.toLowerCase().trim() &&
      e._id !== event?._id &&
      e._id !== eventId
    );
  });

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundColor: themeStyles.background,
        color: themeStyles.text,
      }}
    >
      {/* Global SVG Gradients */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop stopColor="#B3B8E2" offset="0%" />
            <stop stopColor="#8860D9" offset="50%" />
            <stop stopColor="#9575CD" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
      {/* Sidebar */}
      <SideBar />
      {event?.event_status === "cancelled" && (
        <div
          className="mx-4 mt-4 p-4 rounded-2xl flex items-start gap-3"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-red-400 font-semibold text-sm">
                This event has been cancelled
              </p>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
              >
                BY HOST
              </span>
            </div>
            {/* Show cancellation reason if available */}
            {(event as any)?.cancellation_reason && (
              <p className="text-white/70 text-xs mt-0.5 italic">
                Reason: "{(event as any).cancellation_reason}"
              </p>
            )}
            {hasBooked ? (
              <p className="text-white/60 text-xs mt-1">
                Your refund of{" "}
                <span className="text-green-400 font-semibold">
                  ₹{userBooking?.refundAmount ?? userBooking?.subtotal ?? ""}
                </span>{" "}
                has been initiated and will be credited within 5–7 business
                days.
              </p>
            ) : (
              <p className="text-white/60 text-xs mt-1">
                This event is no longer available for booking.
              </p>
            )}
          </div>
        </div>
      )}
      {/* Main Content */}
      <div
        className={`
        flex-1 transition-all duration-300
        w-full max-w-[100vw] overflow-x-hidden
        ${isMobile ? "pl-0" : isCollapsed ? "pl-20" : "pl-64"}
      `}
      >
        {alertMessage && (
          <Alert
            alert={{
              message: alertMessage,
              type: "error",
              show: true,
            }}
            onClose={() => setAlertMessage(null)}
            darkMode={false}
          />
        )}

        <div className="w-full">
          {/* Event Banner */}
          {event?.event_banner && (
            <div
              className={`relative w-full flex flex-col group overflow-hidden ${
                isMobile
                  ? "min-h-[260px]"
                  : "aspect-[1920/720]"
              }`}
            >
              {/* Background image */}
              <img
                src={event.event_banner}
                alt={event.event_name}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Overlay - Consistent dark overlay for hero contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

              {/* Content */}
              <div
                className={`relative z-10 flex-1 flex flex-col justify-between w-full ${isMobile ? "px-4 py-6" : "px-8 py-6"}`}
              >
                {/* Top row */}
                <div
                  className={`flex items-center justify-between ${isMobile ? "mt-2" : "mt-12"}`}
                >
                  <button
                    onClick={handleBack}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 border border-white/20 bg-white/10 backdrop-blur-sm"
                  >
                    <img src={BackIcon.src} alt="Back" className="w-4 h-4" />
                  </button>

                  <div className="flex gap-3">
                    {event?.event_status !== "cancelled" && (
                      <div className="relative">
                        <button
                          onClick={handleLike}
                          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all border border-white/20"
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          <Heart
                            className="w-6 h-6 transition-all"
                            fill={userLiked ? "url(#heartGradient)" : "none"}
                            stroke={userLiked ? "url(#heartGradient)" : "#FFFFFF"}
                            strokeWidth={userLiked ? 1.5 : 2}
                          />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setShowShareOptions(true)}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors border border-white/20 bg-white/10 backdrop-blur-sm"
                    >
                      <img
                        src={ShareIcon.src}
                        alt="Share"
                        className="w-6 h-6"
                      />
                    </button>
                  </div>
                </div>

                {/* Bottom content */}
                <div className="relative">
                  {/* LEFT CONTENT (text column) */}
                  <div className="max-w-4xl transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
                    {/* Meta */}
                    <div className="flex flex-row overflow-x-auto scrollbar-hide flex-nowrap items-center gap-1.5 sm:gap-3 mb-4 max-w-full">
                      {/* Category */}
                      <div
                        className="px-2 py-1 md:px-4 md:py-2 rounded-xl transition-all shadow-lg flex-shrink-0"
                        style={{
                          backgroundColor: isDark
                            ? "#1C2024B2"
                            : "#FFFFFF",
                          backdropFilter: isDark ? "blur(20px)" : "none",
                          color: isDark ? "#FFFFFF" : "#000000",
                          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                        }}
                      >
                        <span className="text-[10px] md:text-sm font-bold">
                          {event.event_category}
                        </span>
                      </div>

                      {/* Subcategory */}
                      {event.event_subcategory && (
                        <div
                          className="px-2 py-1 md:px-4 md:py-2 rounded-xl transition-all shadow-lg flex-shrink-0"
                          style={{
                            backgroundColor: isDark
                              ? "#1C2024B2"
                              : "#FFFFFF",
                            backdropFilter: isDark ? "blur(20px)" : "none",
                            color: isDark ? "#FFFFFF" : "#000000",
                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                          }}
                        >
                          <span className="text-[10px] md:text-sm font-bold">
                            {event.event_subcategory}
                          </span>
                        </div>
                      )}

                      {/* Age */}
                      <div
                        className="px-2 py-1 md:px-4 md:py-2 rounded-xl transition-all shadow-lg flex-shrink-0"
                        style={{
                          backgroundColor: isDark
                            ? "#1C2024B2"
                            : "#FFFFFF",
                          backdropFilter: isDark ? "blur(20px)" : "none",
                          color: isDark ? "#FFFFFF" : "#000000",
                          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                        }}
                      >
                        <span className="text-xs md:text-sm font-bold">
                          {event.min_age_allowed}
                          {event.max_age_allowed
                            ? `-${event.max_age_allowed}`
                            : "+"}
                        </span>
                      </div>

                      {/* Free / Paid */}
                      {event.payment_type && (
                        <div
                          className="px-2 py-1 md:px-4 md:py-2 rounded-xl transition-all shadow-lg flex-shrink-0"
                          style={{
                            backgroundColor: isDark
                              ? "#1C2024B2"
                              : "#FFFFFF",
                            backdropFilter: isDark ? "blur(20px)" : "none",
                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                          }}
                        >
                          <span
                            className="text-xs md:text-sm font-bold"
                            style={{
                              color:
                                event.payment_type === "free"
                                  ? "#10b981"
                                  : "#f59e0b",
                            }}
                          >
                            {event.payment_type === "free" ? "Free" : "Paid"}
                          </span>
                        </div>
                      )}

                      {/* Online */}
                      {event.location_type === "online" && (
                        <div
                          className="px-2 py-1 md:px-4 md:py-2 rounded-xl transition-all shadow-lg flex-shrink-0"
                          style={{
                            backgroundColor: isDark
                              ? "#1C2024B2"
                              : "#FFFFFF",
                            backdropFilter: isDark ? "blur(20px)" : "none",
                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                          }}
                        >
                          <span className="text-blue-500 text-xs md:text-sm font-extrabold">
                            Online
                          </span>
                        </div>
                      )}
                    </div>

                    <h1
                      className={`${isMobile ? "text-2xl sm:text-3xl" : "text-4xl md:text-5xl"} font-bold leading-tight text-white drop-shadow-md break-words`}
                    >
                      {event.event_name}
                    </h1>

                    {/* Host info */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3">
                      {(group?.group_logo || event.event_logo || event.created_by) && (
                        <img
                          src={group?.group_logo || event.event_logo || (event.created_by?.startsWith('http') ? event.created_by : `https://avatar.iran.liara.run/username?username=${event.created_by}`)}
                          alt={group?.group_name || event.created_by}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          style={{
                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)"}`,
                          }}
                        />
                      )}
                      <span className="text-xs sm:text-sm text-white/80">
                        By{" "}
                        <span className="font-bold underline cursor-pointer text-white">
                          {group?.group_name || (group as any)?.name || event.created_by}
                        </span>
                      </span>
                    </div> {/* End of Host info */}
                  </div>

                  {/* Stats and Action Buttons Row */}
                  <div className="flex flex-row items-center justify-between w-full mt-3 sm:mt-4 z-20 relative">
                    {/* Stats */}
                    <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-sm font-extrabold text-white transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <img src={PublicIcon.src} className="w-4 h-4 sm:w-6 sm:h-6" />
                        <span>{eventStats?.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <img src={TicketIcon.src} className="w-4 h-4 sm:w-6 sm:h-6" />
                        <span>{bookingCount}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <img src={ShareIcon.src} className="w-4 h-4 sm:w-6 sm:h-6" />
                        <span>{shareCount}</span>
                      </div>
                    </div>

                    {/* ✅ RIGHT-MOST BUTTONS */}
                    <div
                      className="flex flex-row justify-end items-center gap-1.5 sm:gap-4 xl:absolute xl:right-0 xl:top-1/2 xl:-translate-y-1/2"
                    >
                      {event?.event_status !== "cancelled" && (
                        <>
                          <button
                            onClick={handleSave}
                            className="flex items-center justify-center transition-all px-2.5 py-1 sm:py-2.5 rounded-full border border-[#9575CD] hover:opacity-80 flex-initial"
                            style={{
                              minWidth: isMobile ? '0' : '166.5px',
                              height: isMobile ? '32px' : '48px',
                              background: userSaved
                                ? "rgba(234,179,8,0.3)"
                                : "rgba(255,255,255,0.1)",
                              color: userSaved ? "#facc15" : "#FFFFFF",
                            }}
                          >
                            <img
                              src={WishListIcon.src}
                              className="w-3.5 h-3.5 sm:w-5 sm:h-5 block transition-all"
                              style={{ filter: userSaved ? "none" : "none" }}
                            />
                            <span className="font-bold text-[10px] sm:text-sm">
                              {userSaved ? "Saved" : "Wishlist"}
                            </span>
                          </button>

                          {hasBooked ? (
                            <button
                              onClick={() => {
                                setShowTicketModal(true);
                              }}
                              className="flex items-center justify-center transition-all px-2.5 py-1.5 sm:py-2.5 rounded-full hover:opacity-90 flex-initial"
                              style={{
                                minWidth: isMobile ? '0' : '166.5px',
                                height: isMobile ? '32px' : '48px',
                                background: "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
                                color: "#FFFFFF",
                              }}
                            >
                              <img
                                src={TicketIcon.src}
                                className="w-3.5 h-3.5 sm:w-5 sm:h-5 block"
                                alt="View Ticket"
                              />
                              <span className="font-bold text-[10px] sm:text-sm ml-1 sm:ml-2">View Ticket</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleBookEvent}
                              className="flex items-center justify-center transition-all px-2.5 py-1 sm:py-2.5 rounded-full hover:opacity-90 flex-initial"
                              style={{
                                minWidth: isMobile ? '0' : '166.5px',
                                height: isMobile ? '32px' : '48px',
                                background: "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
                                color: "#FFFFFF",
                              }}
                            >
                              {actionLabel !== "Watch Now" && (
                                <img
                                  src={BookTicketIcon.src}
                                  className="w-3.5 h-3.5 sm:w-5 sm:h-5 block"
                                  alt="Book Ticket"
                                />
                              )}
                              <span className="font-bold text-[10px] sm:text-sm ml-1 sm:ml-2">{actionLabel}</span>
                            </button>
                          )}
                        </>
                      )}
                      {/* Cancelled state — show refund CTA if user has booked */}
                      {event?.event_status === "cancelled" && hasBooked && (
                        <button
                          onClick={() =>
                            router.push(`/bookings/${userBooking?.id}/refund`)
                          }
                          className="flex items-center justify-center h-8 sm:h-12 px-3 sm:px-6 gap-1 sm:gap-2 rounded-full text-white font-semibold text-[10px] sm:text-base"
                          style={{
                            background: "rgba(239,68,68,0.2)",
                            border: "1px solid rgba(239,68,68,0.5)",
                          }}
                        >
                          Track Refund →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="relative z-20 w-full px-2 md:px-8">
            <div
              className={`flex flex-nowrap gap-2 md:gap-4 py-3 w-full items-center justify-start overflow-x-auto scrollbar-hide`}
            >
              {SECTIONS.map((item) => {
                const isActive = activeSection === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex justify-center items-center rounded-[12px] text-[10px] sm:text-sm md:text-base font-bold transition-all duration-200 cursor-pointer shadow-sm text-center leading-tight whitespace-nowrap shrink-0`}
                    style={
                      isActive
                        ? {
                            width: isMobile ? "auto" : `${item.width}px`,
                            height: isMobile ? "38px" : "53px",
                            padding: isMobile ? "0px 12px" : "20px 32px",
                            background: isDark
                              ? `linear-gradient(180deg, #373737 0%, #262626 50%, #1C1C1C 100%) padding-box, linear-gradient(180deg, #666666 0%, #616060 50%, #393939 100%) border-box`
                              : `linear-gradient(180deg, #ffffff 0%, #f9fafb 50%, #f3f4f6 100%) padding-box, linear-gradient(180deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%) border-box`,
                            border: isDark
                              ? "0.6px solid transparent"
                              : "1px solid #d1d5db",
                            color: isDark ? "#FFFFFF" : "#111827",
                            gap: "10px",
                          }
                        : {
                            width: isMobile ? "auto" : `${item.width}px`,
                            height: isMobile ? "38px" : "53px",
                            padding: isMobile ? "0px 12px" : "20px 32px",
                            background: isDark
                              ? "var(--Event_card_bg, #38383833)"
                              : "linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))",
                            border: isDark
                              ? "0.5px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid #e5e7eb",
                            color: isDark ? "#9CA3AF" : "#6B7280",
                            gap: "10px",
                          }
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Sub-Event Badge */}
          {(() => {
            const hasParentFromEvent =
              "isSubEvent" in event &&
              event.isSubEvent &&
              event.parentEventName;
            const hasParentFromResponse = isSubEvent && parentEvent;
            if (!hasParentFromEvent && !hasParentFromResponse) {
              return null;
            }
            const parentName = hasParentFromEvent
              ? event.parentEventName
              : parentEvent?.event_name;
            return (
              <div key="sub-event-badge" className="mb-4">
                <span
                  className="px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(139, 92, 246, 0.2)"
                      : "rgba(237, 233, 254, 0.8)",
                    color: isDark ? "#c084fc" : "#5b21b6",
                    border: isDark
                      ? "1px solid rgba(139, 92, 246, 0.3)"
                      : "1px solid rgba(139, 92, 246, 0.2)",
                  }}
                >
                  Sub Event of {parentName}
                </span>
              </div>
            );
          })()}
          <div
            className="w-full pb-24"
            style={{ backgroundColor: themeStyles.background }}
          >
            {/* ================= MAIN CONTENT ================= */}
            <div className="space-y-4 md:space-y-12 px-4 md:px-8">
              {/* ================= ABOUT ================= */}
              {activeSection === "about" && (
                <div className="px-1 sm:px-4 md:px-8 py-2 md:py-4 space-y-4 md:space-y-12">
                  {/* META ROW */}
                  <div
                    className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 text-sm"
                    style={{ color: themeStyles.text }}
                  >
                    {/* Date */}
                    {event.event_dates?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <img
                          src={CalendarIcon.src}
                          className="w-7 h-7"
                          style={{
                            filter:
                              "brightness(0) saturate(100%) invert(42%) sepia(74%) saturate(3025%) rotate(245deg) brightness(98%) contrast(98%)",
                          }}
                        />
                        <span
                          style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                        >
                          {(() => {
                            const firstDate = new Date(event.event_dates[0].start_date);
                            const lastDate = new Date(event.event_dates[event.event_dates.length - 1].end_date);
                            const isOneDay = event.event_date_type === "one-day";

                            const options: Intl.DateTimeFormatOptions = {
                              weekday: "long",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            };

                            if (isOneDay) {
                              return `${firstDate.toLocaleDateString("en-US", options)}${event.event_dates[0].start_time ? ` · ${event.event_dates[0].start_time}` : ""}`;
                            } else {
                              return `${firstDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" })} - ${lastDate.toLocaleDateString("en-US", options)}`;
                            }
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <img
                          src={LocationIcon.src}
                          className="w-6 h-6"
                          style={{
                            filter:
                              "brightness(0) saturate(100%) invert(42%) sepia(74%) saturate(3025%) rotate(245deg) brightness(98%) contrast(98%)",
                          }}
                        />
                        <span
                          className="break-words line-clamp-2"
                          style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                        >
                          {event.location}
                        </span>
                      </div>
                    )}

                    {/* Free / Paid */}
                    <div className="flex items-center gap-2">
                      <img
                        src={FreeOrPaidIcon.src}
                        className="w-6 h-6"
                        style={{
                          filter:
                            "brightness(0) saturate(100%) invert(42%) sepia(74%) saturate(3025%) rotate(245deg) brightness(98%) contrast(98%)",
                        }}
                      />
                      <span
                        className="capitalize"
                        style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                      >
                        {event.payment_type === "free"
                          ? "Free"
                          : event.ticket_types?.length
                            ? `₹${Math.min(
                                ...event.ticket_types.map(
                                  (t) => t.ticket_price,
                                ),
                              )}`
                            : "Paid"}
                      </span>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <h2
                      className="text-lg font-semibold mb-2"
                      style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                    >
                      Description
                    </h2>

                    <div
                      className={`
          leading-relaxed
          ${!showFullDescription ? "line-clamp-6" : ""}
          [&_*]:!text-inherit
        `}
                      style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                      dangerouslySetInnerHTML={{
                        __html:
                          event.event_description ||
                          "No description available.",
                      }}
                    />

                    {event.event_description &&
                      event.event_description.length > 120 && (
                        <button
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="mt-1 text-blue-500 dark:text-blue-400 text-sm font-bold hover:underline"
                        >
                          {showFullDescription ? "Less" : "More"}
                        </button>
                      )}
                  </div>

                  {/* EVENT GUIDELINES */}
                  {event.event_rules?.type === "text" &&
                    event.event_rules.content && (
                      <div>
                        <h2
                          className="text-lg font-semibold mb-2"
                          style={{ color: isDark ? "#FFFFFF" : "#111827" }}
                        >
                          Event Guidelines
                        </h2>

                        <div
                          className={`
      leading-relaxed
      ${!showFullGuidelines ? "line-clamp-6" : ""}
      [&_*]:!text-inherit
    `}
                          style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                          dangerouslySetInnerHTML={{
                            __html: event.event_rules.content,
                          }}
                        />

                        {event.event_rules.content.length > 120 && (
                          <button
                            onClick={() =>
                              setShowFullGuidelines(!showFullGuidelines)
                            }
                            className="mt-1 text-blue-500 dark:text-blue-400 text-sm font-bold hover:underline"
                          >
                            {showFullGuidelines ? "Less" : "More"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
              )}

              {/* ================= DETAILS ================= */}
              {activeSection === "details" && (
                <div className="space-y-4 md:space-y-[10px] px-1 sm:px-4 md:px-8">
                  {/* DATE PILLS */}
                  <div className="flex flex-wrap gap-4 pt-4 sm:pt-8">
                    {event.event_dates?.map((date, i) => {
                      const start = new Date(date.start_date);
                      const end = date.end_date ? new Date(date.end_date) : null;
                      const isSingleDay = !end ||
                        (start.getFullYear() === end.getFullYear() &&
                         start.getMonth() === end.getMonth() &&
                         start.getDate() === end.getDate());

                      const dateText = isSingleDay
                        ? start.toLocaleDateString("en-US", { day: '2-digit', month: 'short', year: 'numeric' })
                        : `${start.toLocaleDateString("en-US", { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString("en-US", { day: '2-digit', month: 'short', year: 'numeric' })}`;

                      return (
                        <div
                          key={date.start_date || i}
                          className="
                            flex items-center gap-3
                            px-4 py-3
                            rounded-xl
                            text-sm
                            border
                          "
                          style={{
                            background: themeStyles.cardBg,
                            color: themeStyles.text,
                            borderColor: themeStyles.border,
                          }}
                        >
                          <img
                            src={CalendarIcon.src}
                            className="w-5 h-5 flex-shrink-0"
                            style={{
                              filter: isDark
                                ? "brightness(0) invert(1)"
                                : "brightness(0)",
                            }}
                          />
                          <span className="font-medium text-sm md:text-base">
                            {dateText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* MAP CARD */}
                  {event.location && (
                    <div
                      className="
          w-full md:w-[60%]
          h-[260px]
          rounded-2xl
          overflow-hidden
        "
                      style={{ backgroundColor: themeStyles.hoverBg }}
                    >
                      <iframe
                        title="Event Location"
                        width="100%"
                        height="100%"
                        loading="lazy"
                        className="border-0"
                        style={{
                          filter: isDark
                            ? "invert(90%) hue-rotate(180deg)"
                            : "none",
                        }}
                        src={`https://www.google.com/maps?q=${encodeURIComponent(
                          event.location,
                        )}&output=embed`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ================= GUESTS ================= */}
              {activeSection === "guests" && event.guests?.length > 0 && (
                <div className="px-1 sm:px-4 md:px-8 py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-full">
                    {event.guests.map((guest: any, idx: number) => {
                      const getInitials = (name: string) => {
                        if (!name) return "G";
                        const parts = name.trim().split(/\s+/);
                        if (parts.length === 1) return parts[0][0].toUpperCase();
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                      };
                      return (
                        <div
                          key={guest._id || `guest-${idx}`}
                          className="flex items-center gap-3"
                        >
                          {guest.guest_profile ? (
                            <img
                              src={guest.guest_profile}
                              alt={guest.guest_name}
                              className="w-14 h-14 rounded-full object-cover border-2 shrink-0"
                              style={{ borderColor: themeStyles.border }}
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center border-2 font-bold text-xl shrink-0"
                              style={{
                                borderColor: themeStyles.border,
                                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                color: themeStyles.text,
                              }}
                            >
                              {getInitials(guest.guest_name)}
                            </div>
                          )}
                          <p
                            className="font-semibold text-lg"
                            style={{ color: themeStyles.text }}
                          >
                            {guest.guest_name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= PHOTOS ================= */}
              {activeSection === "photos" && event.event_images?.length > 0 && (
                <div className="px-1 sm:px-4 md:px-8 py-2 md:py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {event.event_images.map((img: any, idx: number) => (
                      <button
                        key={img._id || `img-${idx}`}
                        onClick={() => setActivePhoto(img.path)}
                        className="
                          group relative
                          aspect-square
                          rounded-2xl
                          overflow-hidden
                          transition-all duration-300
                          hover:scale-[1.02]
                          hover:shadow-xl
                        "
                        style={{ backgroundColor: themeStyles.hoverBg }}
                      >
                        <img
                          src={img.path}
                          alt={img.originalName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                             <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              <line x1="11" y1="8" x2="11" y2="14"></line>
                              <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* ================= HASHTAGS ================= */}
              {activeSection === "hashtags" && event.hashtag?.length > 0 && (
                <div className="px-1 sm:px-4 md:px-8 py-2">
                  <h2
                    className="text-2xl font-bold mb-6"
                    style={{ color: themeStyles.text }}
                  >
                    Hashtags
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {event.hashtag.map((tag, l) => (
                      <span
                        key={`${tag}-${l}`}
                        className="px-6 py-2.5 rounded-xl text-sm md:text-base font-semibold border transition-all duration-200"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(59, 130, 246, 0.05)",
                          borderColor: isDark
                            ? "rgba(59, 130, 246, 0.3)"
                            : "rgba(59, 130, 246, 0.2)",
                          color: isDark ? "#60A5FA" : "#2563EB",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= ADDITIONAL ================= */}
              {activeSection === "additional" && hasAdditionalInfo && (
                <div className="space-y-4 md:space-y-[10px]">
                  {/* ---------- POINT OF CONTACT ---------- */}
                  {event.POCS?.length > 0 && (
                    <div className="px-4 md:px-8 py-2">
                      <h2
                        className="text-lg font-semibold mb-4"
                        style={{ color: themeStyles.text }}
                      >
                        Point of Contact
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {event.POCS.map((poc: any, idx: number) => (
                          <div
                            key={poc._id || `poc-${idx}`}
                            className="flex items-center gap-4"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold shrink-0"
                              style={{ background: "#8860D9" }}
                            >
                              {poc.POC_name?.split(" ")
                                .filter(Boolean)
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .substring(0, 2) || ""}
                            </div>

                            <div className="overflow-hidden min-w-0">
                              <p
                                className="font-medium truncate"
                                style={{ color: themeStyles.text }}
                              >
                                {poc.POC_name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                {poc.POC_email}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                {poc.POC_contact}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ---------- PROHIBITED ITEMS ---------- */}
                  {event.prohibited_items?.length > 0 && (
                    <div className="px-4 md:px-8 py-2">
                      <h2
                        className="text-lg font-semibold mb-3"
                        style={{ color: themeStyles.text }}
                      >
                        Prohibited Items
                      </h2>

                      <div className="flex flex-wrap gap-3">
                        {event.prohibited_items.map(
                          (item: string, i: number) => (
                            <span
                              key={`${item}-${i}`}
                              className="px-4 py-2 rounded-lg text-sm font-medium"
                              style={{
                                background: isDark
                                  ? "#F94E5480"
                                  : "rgba(249, 78, 84, 0.1)",
                                color: isDark ? "#FFFFFF" : "#F94E54",
                              }}
                            >
                              {item}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {(event.kids_friendly ||
                    event.pet_friendly ||
                    event.event_instagram_link ||
                    event.event_youtube_link) && (
                    <div className="px-4 md:px-8 py-2">
                      <h2
                        className="text-lg font-semibold mb-4"
                        style={{ color: themeStyles.text }}
                      >
                        More Information
                      </h2>

                      <div className="flex flex-wrap gap-4">
                        {/* Kids Friendly */}
                        {event.kids_friendly && (
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: isDark
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <img
                                src={KidIcon.src}
                                alt="Kids Friendly"
                                className="w-5 h-5"
                                style={{
                                  filter: isDark
                                    ? "brightness(0) invert(1)"
                                    : "brightness(0)",
                                }}
                              />
                            </div>
                            <span
                              className="text-sm"
                              style={{ color: themeStyles.textSecondary }}
                            >
                              Kids friendly event
                            </span>
                          </div>
                        )}

                        {/* Pets Friendly */}
                        {event.pet_friendly && (
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: isDark
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <img
                                src={PetIcon.src}
                                alt="Pets Friendly"
                                className="w-5 h-5"
                                style={{
                                  filter: isDark
                                    ? "brightness(0) invert(1)"
                                    : "brightness(0)",
                                }}
                              />
                            </div>
                            <span
                              className="text-sm"
                              style={{ color: themeStyles.textSecondary }}
                            >
                              Pets friendly event
                            </span>
                          </div>
                        )}

                        {/* Instagram */}
                        {event.event_instagram_link && (
                          <a
                            href={event.event_instagram_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 max-w-full"
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                              }}
                            >
                              <img
                                src={InstagramIcon.src}
                                alt="Instagram"
                                className="w-5 h-5"
                                style={{ filter: "brightness(0) invert(1)" }}
                              />
                            </div>

                            <span className="text-sm text-blue-400 hover:underline">
                              Instagram
                            </span>
                          </a>
                        )}

                        {/* YouTube */}
                        {event.event_youtube_link && (
                          <a
                            href={event.event_youtube_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 max-w-full"
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: "#FF0000",
                              }}
                            >
                              <img
                                src={YoutubeIcon.src}
                                alt="YouTube"
                                className="w-5 h-5"
                                style={{ filter: "brightness(0) invert(1)" }}
                              />
                            </div>

                            <span className="text-sm text-red-400 hover:underline">
                              YouTube
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {isMainEvent(event) && event.sub_events && event.sub_events.length > 0 && (
            <div className="mt-10 px-4 md:px-8">
              <SubEventGrid subEvents={event.sub_events} />
            </div>
          )}
          <div className="mt-10">
            <SimilarEvents similarEvents={similarEvents} />
          </div>
        </div>

        <BookingModal
          show={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setIsViewTicketMode(false);
            setSelectedTicketType(null);
            setQuantity(1);
          }}
          event={event}
          selectedTicketType={selectedTicketType}
          setSelectedTicketType={setSelectedTicketType}
          quantity={quantity}
          setQuantity={setQuantity}
          isBooking={isBooking}
          onInitiateBooking={event?.payment_type === "free" ? handleFreeRegistration : initiateBooking}
          variant="BOOK"
          onViewMore={() => {
             setShowBookingModal(false);
             setIsViewTicketMode(false);
             router.push('/events');
          }}
        />
        <BookingModal
          show={showSuccessModal}
          variant="SUCCESS"
          onClose={() => setShowSuccessModal(false)}
          event={event}
          quantity={quantity}
          selectedTicketType={selectedTicketType}
        />
        <BookingModal
          show={showTicketModal}
          variant="VIEW"
          onClose={() => setShowTicketModal(false)}
          booking={userBooking}
          event={event}
        />
        {activePhoto && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 transition-opacity duration-300"
            onClick={() => setActivePhoto(null)}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-50 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setActivePhoto(null);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Photo Container */}
            <div
              className="relative max-w-5xl w-full max-h-full flex justify-center animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activePhoto}
                alt="Full preview"
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border border-white/10"
              />
            </div>
          </div>
        )}
      </div>
      {/* Local Style to hide scrollbar while keeping scroll functionality */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          display: none;
        }
        html, body {
          -ms-overflow-style: none;
          scrollbar-width: none;
          scrollbar-hide: true;
        }
      ` }} />
    </div>
  );
}
