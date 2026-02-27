import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ChevronLeft,
  Radio,
  Edit2,
  Calendar,
  MapPin,
  Users,
  Tag,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Info,
  CreditCard,
  Hash,
  Phone,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import SideBar from "../../components/HomePage/SideBar.jsx";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import { getImageUrl } from "../../utils/imageUtils.js";
import { getMyLiveEventView, goLiveSubEvent } from "../../services/ticketService.js";
import { toast } from "react-hot-toast";

const HEADER_HEIGHT = 72;

const ConfirmAddOnEvent = () => {
  const { parentEventId, subEventId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [parentEvent, setParentEvent] = useState(null);
  const [subEvent, setSubEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGoingLive, setIsGoingLive] = useState(false);

  // ── Theme ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const handleThemeToggle = () => {
    const n = !isDark;
    setIsDark(n);
    document.documentElement.classList.toggle("dark", n);
    localStorage.setItem("theme", n ? "dark" : "light");
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#212426]",
        cardBgDarker: "bg-[#1C1C1E]",
        border: "border-[#33373A]",
        inactivePill: "bg-[#2C2C2E] text-[#c9c9cf]",
      }
    : {
        bg: "bg-[#F0F2F5]",
        text: "text-gray-900",
        subText: "text-gray-500",
        cardBg: "bg-white",
        cardBgDarker: "bg-gray-100",
        border: "border-gray-200",
        inactivePill: "bg-gray-200 text-gray-600",
      };

  const cardStyle = {
    border: "2px solid transparent",
    backgroundImage: isDark
      ? "linear-gradient(#212426,#212426),linear-gradient(135deg,#2a2a2a,#3a3a3a)"
      : "linear-gradient(#fff,#fff),linear-gradient(135deg,#e8e8e8,#f5f5f5)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    boxShadow: isDark
      ? "8px 8px 16px #0d0e0f, -8px -8px 16px #353a3d"
      : "8px 8px 16px #c8cacf, -8px -8px 16px #ffffff",
  };

  const neumorphShadow = {
    boxShadow: isDark
      ? "-3px -3px 6px rgba(60,60,60,0.3), 3px 3px 6px rgba(0,0,0,0.6)"
      : "-3px -3px 6px rgba(255,255,255,0.8), 3px 3px 6px rgba(0,0,0,0.15)",
  };

  // ── Fetch data ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!parentEventId) return;
      try {
        setLoading(true);
        const response = await getMyLiveEventView(parentEventId);
        const data =
          response?.ticket ||
          response?.data?.ticket ||
          response?.data ||
          response;

        if (!data) throw new Error("Event not found");
        setParentEvent(data);

        // Find the specific sub-event
        const se = (data.sub_events || []).find(
          (s) => s._id?.toString() === subEventId
        );
        if (!se) throw new Error("Sub-event not found");
        setSubEvent(se);
      } catch (err) {
        toast.error(err.message || "Failed to load sub-event");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [parentEventId, subEventId]);

  // ── Go Live ────────────────────────────────────────────────────────────
  const handleGoLive = async () => {
    try {
      setIsGoingLive(true);
      const response = await goLiveSubEvent(parentEventId, subEventId);
      if (response.success) {
        toast.success("Sub-event is now live!");
        navigate(`/ticket/live-add-on-event-view/${subEventId}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to go live";
      toast.error(msg);
    } finally {
      setIsGoingLive(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────
  const formattedDate = useMemo(() => {
    const d = subEvent?.event_dates?.[0]?.start_date;
    if (!d) return "Date TBA";
    return new Date(d).toLocaleDateString("en-US", {
      day: "2-digit", month: "long", year: "numeric",
    });
  }, [subEvent]);

  const startTime = useMemo(() => {
    const t = subEvent?.event_dates?.[0]?.start_time;
    if (!t) return "N/A";
    return new Date(`1970-01-01T${t}`).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "numeric", hour12: true,
    });
  }, [subEvent]);

  const statusColor = {
    confirmed: "text-green-400",
    live:      "text-emerald-400",
    cancelled: "text-red-400",
    remove:    "text-red-400",
    deleted:   "text-red-400",
    pending:   "text-yellow-400",
  };

  // ── Section card component ─────────────────────────────────────────────
  const SectionCard = ({ icon: Icon, title, children, accent = "#6942B8" }) => (
    <div
      className="rounded-2xl p-5"
      style={{ ...cardStyle, borderRadius: "20px" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <h3 className={`font-semibold text-sm ${theme.text}`}>{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="flex items-start justify-between py-2 border-b last:border-0"
      style={{ borderColor: isDark ? "#33373A" : "#e5e7eb" }}>
      <span className={`text-xs ${theme.subText}`}>{label}</span>
      <span className={`text-xs font-medium ${theme.text} text-right max-w-[60%]`}>
        {value || "N/A"}
      </span>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`${isDark ? "bg-[#212426]" : "bg-[#F0F2F5]"} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading sub-event...</p>
        </div>
      </div>
    );
  }

  if (!subEvent) {
    return (
      <div className={`${isDark ? "bg-[#212426]" : "bg-[#F0F2F5]"} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">Sub-event not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 rounded-full bg-purple-600 text-white text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden`}>
      {/* ── Sidebar ── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 transition-colors duration-300"
        style={{
          position: "fixed", left: 0, top: 0, bottom: 0, width: "80px",
          zIndex: 40,
          backgroundColor: isDark ? "#212426" : "#f9f9f9",
          overflowY: "auto", overflowX: "hidden",
        }}
      >
        <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
          <img src={WieLogo} alt="Wie Logo" className="w-10 h-10" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 md:ml-20 overflow-x-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex md:hidden items-center justify-between w-full">
            <img src={WieLogo} alt="WIE Logo" className="w-8 h-8 object-contain" />
            <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
          </div>
          <div className="hidden md:flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0">
              <SearchBar
                theme={theme}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onTuneClick={() => {}}
              />
            </div>
            <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 p-4 md:p-6 lg:px-8 pb-32 md:pb-10 overflow-y-auto ${theme.bg}`}>
          {/* ── Page header ── */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                style={neumorphShadow}
                className={`w-11 h-11 rounded-full flex items-center justify-center ${theme.bg} ${theme.text} hover:scale-105 transition-transform flex-shrink-0`}
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#6942B8,#9B59B6)" }}
                  >
                    SUB-EVENT
                  </span>
                  <span className={`text-xs ${statusColor[subEvent.event_status] || "text-gray-400"} font-semibold uppercase`}>
                    {subEvent.event_status}
                  </span>
                </div>
                <h1 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
                  {subEvent.event_name}
                </h1>
                <p className={`text-sm ${theme.subText} mt-0.5`}>
                  Part of:{" "}
                  <span
                    className="text-purple-400 cursor-pointer hover:underline"
                    onClick={() => navigate(`/ticket/live-event-view/${parentEventId}`)}
                  >
                    {parentEvent?.event_name}
                  </span>
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Edit */}
              {(subEvent.event_status === "confirmed" || subEvent.event_status === "live") && (
                <button
                  onClick={() => navigate(`/ticket/update-ticket-addons/${parentEventId}`)}
                  style={neumorphShadow}
                  className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold
                    ${theme.bg} ${theme.text} hover:scale-105 transition-all`}
                >
                  <Edit2 size={15} className="text-purple-400" />
                  Edit
                </button>
              )}

              {/* Go Live */}
              {subEvent.event_status === "confirmed" && (
                <button
                  onClick={handleGoLive}
                  disabled={isGoingLive}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white
                    disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-all shadow-lg"
                  style={{
                    background: "linear-gradient(135deg,#16a34a,#22c55e)",
                    boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
                  }}
                >
                  {isGoingLive ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Going Live...
                    </>
                  ) : (
                    <>
                      <Radio size={15} />
                      Go Live
                    </>
                  )}
                </button>
              )}

              {/* View Live */}
              {subEvent.event_status === "live" && (
                <button
                  onClick={() => navigate(`/ticket/live-add-on-event-view/${subEventId}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white
                    hover:scale-105 transition-all shadow-lg"
                  style={{
                    background: "linear-gradient(135deg,#6942B8,#9B59B6)",
                    boxShadow: "0 4px 20px rgba(105,66,184,0.4)",
                  }}
                >
                  <Layers size={15} />
                  View Live
                </button>
              )}
            </div>
          </div>

          {/* ── Banner ── */}
          <div className="relative rounded-3xl overflow-hidden mb-6 h-48 md:h-64"
            style={{ ...cardStyle, borderRadius: "24px" }}>
            {subEvent.event_banner ? (
              <img
                src={getImageUrl(subEvent.event_banner, "ticket")}
                alt={subEvent.event_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${theme.cardBgDarker}`}>
                <ImageIcon className={`w-12 h-12 ${theme.subText} opacity-30`} />
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Status badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{
                  background: subEvent.event_status === "confirmed"
                    ? "rgba(34,197,94,0.85)"
                    : subEvent.event_status === "live"
                    ? "rgba(16,185,129,0.85)"
                    : "rgba(239,68,68,0.85)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <CheckCircle2 size={12} />
                {subEvent.event_status?.toUpperCase()}
              </span>
            </div>

            {/* Logo */}
            {subEvent.event_logo && (
              <div className="absolute bottom-4 right-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30"
                  style={{ backdropFilter: "blur(8px)" }}>
                  <img
                    src={getImageUrl(subEvent.event_logo, "ticket")}
                    alt="logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Confirmed notice ── */}
          {subEvent.event_status === "confirmed" && (
            <div
              className="flex items-start gap-3 p-4 rounded-2xl mb-6"
              style={{
                background: isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              <ShieldCheck className="text-green-400 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-semibold text-sm">Sub-event confirmed & saved</p>
                <p className={`text-xs ${theme.subText} mt-0.5`}>
                  Your sub-event is ready. Click <strong className="text-white">Go Live</strong> when
                  you're ready to publish it under <em>{parentEvent?.event_name}</em>.
                  Make sure the parent event is live first.
                </p>
              </div>
            </div>
          )}

          {/* ── Info grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Basic Details */}
            <SectionCard icon={Info} title="Event Details" accent="#6942B8">
              <InfoRow label="Category"    value={subEvent.event_category} />
              <InfoRow label="Sub-category" value={subEvent.event_subcategory} />
              <InfoRow label="Type"        value={subEvent.event_type} />
              <InfoRow label="Language"    value={subEvent.event_language?.join(", ")} />
              <InfoRow label="Status"      value={subEvent.event_status} />
            </SectionCard>

            {/* Date & Time */}
            <SectionCard icon={Calendar} title="Date & Time" accent="#3B82F6">
              <InfoRow label="Date"           value={formattedDate} />
              <InfoRow label="Start Time"     value={startTime} />
              <InfoRow label="Gate Opens"     value={subEvent.gate_open_time } />
              <InfoRow label="Date Type"      value={subEvent.event_date_type} />
              <InfoRow label="Total Days"     value={subEvent.event_dates?.length} />
            </SectionCard>

            {/* Location */}
            <SectionCard icon={MapPin} title="Location" accent="#EF4444">
              <InfoRow label="Type"     value={subEvent.location_type} />
              <InfoRow label="Location" value={subEvent.location} />
              <InfoRow label="Venue"    value={subEvent.venue} />
            </SectionCard>

            {/* Capacity & Age */}
            <SectionCard icon={Users} title="Capacity & Age" accent="#F59E0B">
              <InfoRow label="Total Capacity" value={subEvent.total_capacity} />
              <InfoRow label="Min Age"        value={subEvent.min_age_allowed} />
              <InfoRow label="Max Age"        value={subEvent.max_age_allowed} />
              <InfoRow label="Kids Friendly"  value={subEvent.kids_friendly ? "Yes" : "No"} />
              <InfoRow label="Pet Friendly"   value={subEvent.pet_friendly ? "Yes" : "No"} />
            </SectionCard>

            {/* Tickets */}
            <SectionCard icon={Ticket} title="Ticket Types" accent="#10B981">
              {subEvent.ticket_types?.length > 0 ? (
                <div className="space-y-2">
                  {subEvent.ticket_types.map((t, i) => (
                    <div key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                      style={{ background: isDark ? "#2C2C2E" : "#f3f4f6" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: t.color || "#6942B8" }} />
                        <span className={`text-xs font-medium ${theme.text}`}>{t.ticket_type}</span>
                      </div>
                      <span className={`text-xs ${theme.subText}`}>
                        {t.ticket_price ? `₹${t.ticket_price}` : "Free"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${theme.subText} text-center py-3`}>No ticket types added</p>
              )}
            </SectionCard>

            {/* Payment */}
            <SectionCard icon={CreditCard} title="Payment" accent="#8B5CF6">
              <InfoRow label="Payment Type"  value={subEvent.payment_type} />
              <InfoRow label="Booking Start" value={
                subEvent.booking_start_date
                  ? new Date(subEvent.booking_start_date).toLocaleDateString()
                  : "N/A"
              } />
              <InfoRow label="Booking End" value={
                subEvent.booking_end_date
                  ? new Date(subEvent.booking_end_date).toLocaleDateString()
                  : "N/A"
              } />
            </SectionCard>
          </div>

          {/* ── Description ── */}
          {subEvent.event_description && (
            <div className="rounded-2xl p-5 mb-4" style={{ ...cardStyle, borderRadius: "20px" }}>
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-purple-400" />
                <h3 className={`font-semibold text-sm ${theme.text}`}>Description</h3>
              </div>
              <p className={`text-sm leading-relaxed ${theme.subText}`}>
                {subEvent.event_description}
              </p>
            </div>
          )}

          {/* ── Hashtags ── */}
          {subEvent.hashtag?.length > 0 && (
            <div className="rounded-2xl p-5 mb-4" style={{ ...cardStyle, borderRadius: "20px" }}>
              <div className="flex items-center gap-2 mb-3">
                <Hash size={16} className="text-blue-400" />
                <h3 className={`font-semibold text-sm ${theme.text}`}>Hashtags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {subEvent.hashtag.map((tag, i) => (
                  <span key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ background: "linear-gradient(135deg,#6942B8,#9B59B6)" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── POCs ── */}
          {subEvent.POCS?.length > 0 && (
            <div className="rounded-2xl p-5 mb-4" style={{ ...cardStyle, borderRadius: "20px" }}>
              <div className="flex items-center gap-2 mb-3">
                <Phone size={16} className="text-green-400" />
                <h3 className={`font-semibold text-sm ${theme.text}`}>Points of Contact</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {subEvent.POCS.map((poc, i) => (
                  <div key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: isDark ? "#2C2C2E" : "#f3f4f6" }}>
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center">
                      <span className="text-purple-400 text-xs font-bold">
                        {poc.POC_name?.[0]?.toUpperCase() || "P"}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${theme.text}`}>{poc.POC_name}</p>
                      <p className={`text-[10px] ${theme.subText}`}>{poc.POC_phone || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Bottom action bar (mobile) ── */}
          <div className="md:hidden fixed bottom-20 left-0 right-0 px-4 z-40">
            <div
              className="flex gap-3 p-3 rounded-2xl"
              style={{
                background: isDark ? "rgba(33,36,38,0.95)" : "rgba(255,255,255,0.95)",
                backdropFilter: "blur(16px)",
                boxShadow: isDark
                  ? "0 -8px 32px rgba(0,0,0,0.5)"
                  : "0 -8px 32px rgba(0,0,0,0.1)",
              }}
            >
              {(subEvent.event_status === "confirmed" || subEvent.event_status === "live") && (
                <button
                  onClick={() => navigate(`/ticket/update-ticket-addons/${parentEventId}`)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold ${theme.subText}`}
                  style={{ background: isDark ? "#2C2C2E" : "#f3f4f6" }}
                >
                  <Edit2 size={15} />
                  Edit
                </button>
              )}

              {subEvent.event_status === "confirmed" && (
                <button
                  onClick={handleGoLive}
                  disabled={isGoingLive}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white
                    disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}
                >
                  {isGoingLive ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Radio size={15} />
                  )}
                  {isGoingLive ? "Going Live..." : "Go Live"}
                </button>
              )}

              {subEvent.event_status === "live" && (
                <button
                  onClick={() => navigate(`/ticket/live-add-on-event-view/${subEventId}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6942B8,#9B59B6)" }}
                >
                  <Layers size={15} />
                  View Live
                </button>
              )}
            </div>
          </div>
        </main>

        <BottomNavigation theme={theme} user={user} />
      </div>
    </div>
  );
};
export default ConfirmAddOnEvent;