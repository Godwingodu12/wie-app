export interface ExactMapLocation {
  latitude: number;
  longitude: number;
  address: string;
}
export interface EventDate {
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  event_link?: string;
  video_name?: string;
  verification_event_code?: string;
  video_file_path?: string;
  preview_image_path?: string;
  _id: string;
}
export interface EventRules {
  type: "text" | "file";
  content?: string;
  path?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  _id?: string;
}
export interface Guest {
  guest_name: string;
  guest_profile: string;
  guest_link?: string;
  _id: string;
}
export interface POC {
  POC_name: string;
  POC_email: string;
  POC_contact: string;
  _id: string;
}
export interface EventImage {
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  _id: string;
}
export interface BankingDetail {
  bank_acc_type: string;
  bank_acc_no: string;
  bank_ifsc: string;
  bank_acc_holder: string;
  _id: string;
}
export interface TicketType {
  ticket_type: string;
  ticket_price: number;
  ticket_photo?: string;
  ticket_photo_public_id?: string;
  max_capacity: number;
  _id: string;
}
export interface FormProgress {
  basic_info: boolean;
  media: boolean;
  banking_tickets: boolean;
  add_on_events: boolean;
  terms_conditions: boolean;
}
export interface SubEvent {
  exact_map_location?: ExactMapLocation;
  event_name: string;
  event_category: string;
  event_subcategory: string;
  event_type: string;
  subevent: string;
  event_language: string[];
  location_type: "online" | "offline" | "recorded";
  location: string;
  venue: string;
  seating_arrangement?: string;
  min_age_allowed: number;
  max_age_allowed: number;
  kids_friendly: boolean;
  pet_friendly: boolean;
  event_date_type: "one-day" | "multi-day";
  event_dates: EventDate[];
  gate_open_time?: string;
  event_instagram_link?: string;
  event_youtube_link?: string;
  event_rules?: EventRules;
  POCS: POC[];
  prohibited_items: string[];
  event_description: string;
  event_logo?: string;
  event_banner?: string;
  event_images: EventImage[];
  hashtag: string[];
  payment_type: "free" | "paid";
  banking_details?: BankingDetail[];
  guests: Guest[];
  ticket_types: TicketType[];
  ticket_layout?: string;
  total_capacity: string;
  booking_start_date: string;
  booking_end_date: string;
  like: number;
  created_by?: string;
  event_status: "pending" | "live" | "completed" | "cancelled";
  seating_layout?: SeatingLayout;
  _id: string;
  createdAt: string;
  updatedAt: string;
  distance?: number;
  distance_unit?: string;
  is_nearby?: boolean;
  location_note?: string;
  isSubEvent?: boolean;
  parentEventId?: string;
  parentEventName?: string;
  parentEventCategory?: string;
  parentEventBanner?: string;
  parentEventLogo?: string;
}
export interface Event {
  _id: string;
  event_name: string;
  event_category: string;
  event_subcategory: string;
  event_type: "public" | "private";
  event_language: string[];
  min_age_allowed: number;
  max_age_allowed?: number;
  seating_arrangement?: string | null;
  kids_friendly: boolean;
  pet_friendly: boolean;
  location_type: "online" | "offline" | "recorded";
  location: string;
  venue: string;
  event_date_type: "one-day" | "multi-day";
  event_dates: EventDate[];
  event_instagram_link?: string;
  gate_open_time?: string;
  event_youtube_link?: string;
  event_link?: string;
  verification_event_code?: string;
  prohibited_items: string[];
  event_description: string;
  hashtag: string[];
  guests: Guest[];
  POCS: POC[];
  created_by: string;
  like: number;
  event_ticket_offer: boolean;
  groupId: string;
  userId: string;
  event_status: "pending" | "live" | "completed" | "cancelled";
  updated_by: string;
  updated_at: string;
  terms_accepted: boolean;
  event_images: EventImage[];
  banking_details?: BankingDetail[];
  ticket_types: TicketType[];
  offerTickets: any[];
  sub_events: SubEvent[];
  createdAt: string;
  updatedAt: string;
  event_banner?: string;
  event_logo?: string;
  event_rules?: EventRules;
  booking_end_date?: string;
  booking_start_date?: string;
  payment_type?: "free" | "paid";
  total_capacity?: string;
  exact_map_location?: ExactMapLocation;
  form_progress?: FormProgress;
  seating_layout?: SeatingLayout;
  __v?: number;
}
export interface SearchLocation {
  latitude: number;
  longitude: number;
  radius: number;
  radius_unit: string;
}

export interface NearbyEvent extends Event {
  distance: number;
  distance_unit: string;
  main_event_distance: number | null;
  is_main_event_nearby: boolean;
  has_nearby_sub_events: boolean;
  nearby_sub_events_count: number;
  nearby_sub_events: SubEvent[];
  total_sub_events: number;
  all_sub_events_with_distance?: SubEvent[];
}
export interface NearbyEventsParams {
  latitude?: number;
  longitude?: number;
  location?: string;
  radius?: number;
}
export interface NearbyEventsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    search_location: SearchLocation;
    events: NearbyEvent[];
  };
}

export interface LiveEventsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    tickets: Event[];
  };
}
export interface SingleEventResponse {
  success: boolean;
  message: string;
  data: Event;
}
export interface Group {
  _id: string;
  group_name: string;
  group_description?: string;
  group_logo?: string;
  group_banner?: string;
  created_by: string;
  members_count?: number;
  events_count?: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
export interface ActiveGroupsResponse {
  success: boolean;
  message: string;
  data: Group[];
}
export interface TicketApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}
export interface EventFilters {
  category?: string;
  subcategory?: string;
  location_type?: "online" | "offline" | "recorded";
  payment_type?: "free" | "paid";
  min_distance?: number;
  max_distance?: number;
  date_from?: string;
  date_to?: string;
  kids_friendly?: boolean;
  pet_friendly?: boolean;
}
export interface ParentEventSummary {
  _id: string;
  event_name: string;
  event_category: string;
  event_banner?: string;
  event_logo?: string;
  location: string;
  event_dates: EventDate[];
}

export interface EventDetailResponse {
  success: boolean;
  message: string;
  data: {
    event: Event | SubEvent;
    isSubEvent: boolean;
    parentEvent: ParentEventSummary | null;
  };
}
export interface NearbySubEvent extends SubEvent {
  distance: number;
  distance_unit: string;
  is_nearby: boolean;
  location_note?: string;
}
export interface EventWithLocation extends Event {
  distance?: number;
  distance_unit?: string;
  main_event_distance?: number | null;
  is_main_event_nearby?: boolean;
  has_nearby_sub_events?: boolean;
  nearby_sub_events_count?: number;
  nearby_sub_events?: NearbySubEvent[];
  total_sub_events?: number;
  all_sub_events_with_distance?: NearbySubEvent[];
  isSubEvent?: boolean;
  parentEventId?: string | null;
  parentEventName?: string | null;
  parentEventCategory?: string | null;
  parentEventBanner?: string | null;
  parentEventLogo?: string | null;
}
export interface CategoryEventsParams {
  category?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  userId?: string;
  countryCode?: string;
  searchQuery?: string;
}
export interface LocationSearchResponse {
  success: boolean;
  message: string;
  data: {
    locationAvailable: boolean;
    locationSource: "gps" | "manual" | "none";
    searchLocation?: { latitude: number; longitude: number } | string | null;
    searchedLocationName?: string | null;
    searchRadius: number;
    categories: string[];
    eventsByCategory: Record<string, EventWithLocation[]>;
    totalEvents: number;
    hasSuggestions: boolean;
    suggestionCategories: string[];
    suggestionsByCategory: Record<string, EventWithLocation[]>;
    totalSuggestions: number;
    suggestionRadius?: number;
    countryCode?: string | null;
    countryName?: string | null;
  };
}
export interface NameSearchResponse {
  success: boolean;
  message: string;
  data: {
    searchQuery: string;
    categories: string[];
    eventsByCategory: Record<string, EventWithLocation[]>;
    totalEvents: number;
    countryCode?: string | null;
    countryName?: string | null;
  };
}
export interface InitialEventsResponse {
  success: boolean;
  message: string;
  data: {
    locationAvailable: boolean;
    locationSource: "gps" | "manual" | "saved" | "country" | "none";
    searchLocation?: { latitude: number; longitude: number } | string | null;
    searchRadius?: number | null;
    categories: string[];
    eventsByCategory: Record<string, EventWithLocation[]>;
    totalEvents: number;
    countryCode?: string | null;
    countryName?: string | null;
  };
}
export interface CategorySearchParams {
  category?: string;
  userId?: string;
}
export interface LocationSearchParams {
  latitude?: number;
  longitude?: number;
  location?: string;
  radius?: number;
  userId?: string;
}
export interface NameSearchParams {
  searchQuery: string;
  userId?: string;
}
export interface FilterEventsParams {
  category?: string;
  subcategory?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  searchQuery?: string;
  radius?: number; // in kilometers (1-500)
  locationType?: "online" | "offline" | "recorded";
  eventLanguage?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  bookingStartDate?: string; // YYYY-MM-DD
  bookingEndDate?: string; // YYYY-MM-DD
  userId?: string;
}

export interface FilteredEventsResponse {
  success: boolean;
  message: string;
  data: {
    locationAvailable: boolean;
    locationSource: "gps" | "manual" | "saved" | "country" | "none";
    searchLocation?:
      | {
          latitude: number;
          longitude: number;
        }
      | string;
    searchRadius?: number | null;
    appliedFilters: {
      category: string | null;
      subcategory: string | null;
      searchQuery: string | null;
      locationType: string | null;
      eventLanguage: string | null;
      startDate: string | null;
      endDate: string | null;
      bookingStartDate: string | null;
      bookingEndDate: string | null;
    };
    categories: string[];
    eventsByCategory: Record<string, EventWithLocation[]>;
    totalEvents: number;
    countryCode?: string | null;
    countryName?: string | null;
  };
}
export const EVENT_LANGUAGES = [
  "English",
  "Hindi",
  "Malayalam",
  "Tamil",
  "Kannada",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Bengali",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Russian",
  "Turkish",
  "Korean",
  "Portuguese",
  "Arabic",
  "Indonesian",
  "Vietnamese",
  "Other",
] as const;
export type EventLanguage = (typeof EVENT_LANGUAGES)[number];
export interface CategoryEventsResponse {
  success: boolean;
  message: string;
  data: {
    locationAvailable: boolean;
    locationSource: "gps" | "manual" | "saved" | "country" | "none";
    searchLocation?:
      | {
          latitude: number;
          longitude: number;
        }
      | string
      | null;
    searchQuery?: string | null;
    searchRadius?: number | null;
    categories: string[];
    eventsByCategory: Record<string, EventWithLocation[]>;
    eventsByDistanceAndCategory?: Record<
      string,
      Record<string, EventWithLocation[]>
    >;
    totalEvents: number;
    eventsWithLocation?: number;
    totalEventsBeforeFilter?: number;
    countryCode?: string | null;
    countryName?: string | null;
    hasSuggestions?: boolean;
    suggestionCategories?: string[];
    suggestionsByCategory?: Record<string, EventWithLocation[]>;
    totalSuggestions?: number;
    suggestionRadius?: number;
  };
}
export interface CategoryPopularEventsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    events: EventWithLocation[];
  };
}
export interface SeatInfo {
  seatId: string;
  row: string;
  column: number;
  isAvailable: boolean;
  isSelected: boolean;
  ticketTypeId: string | null;
  ticketTypeName: string | null;
  ticketTypeColor: string | null;
  price: number;
}
export interface SeatingLayout {
  rows: string[];
  columns: number;
  seats?: SeatInfo[];
  ticketTypeAssignments: Array<{
    ticketTypeId: string;
    ticketTypeName: string;
    color: string;
    assignedSeats: string[];
    capacity: number;
    price: number;
  }>;
}
export interface CreateSeatedBookingRequest {
  ticketId: string;
  selectedSeats: string[];
}

export interface SeatDetail {
  seatId: string;
  row: string;
  column: number;
  ticketType: string;
  ticketTypeId: string;
  price: number;
  color: string;
}
export const EVENT_CATEGORIES = [
  "Sports, Fitness, & Adventure",
  "Music",
  "Arts, Culture, & Literature",
  "Dance",
  "Business & Innovation",
  "Food, Lifestyle, & Wellness",
  "Film, Media, & Gaming",
  "Travel, Holidays, & Tourism",
  "Festivals & Celebrations",
  "Environment, Sustainability, & Agriculture",
  "Religious & Spiritual Events",
  "Education & Learning",
] as const;
export interface RefundTransaction {
  id: string;
  amount: number;
  status: string;
  method: string;
  refundId?: string;
  webhookData?: any;
  createdAt: string;
  updatedAt: string;
}
export interface RefundDetails {
  booking: any;
  refundTransactions: RefundTransaction[];
}
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventSortBy = "distance" | "date" | "price" | "popularity";
export type SortOrder = "asc" | "desc";
export type EventStatus = "pending" | "live" | "completed" | "cancelled";
export type LocationType = "online" | "offline";
export type PaymentType = "free" | "paid";
export type EventDateType = "one-day" | "multi-day";
export type EventType = "public" | "private";
