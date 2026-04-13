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

export const SUBCATEGORIES: Record<string, string[]> = {
  "Arts, Culture, & Literature": [
    "Art Exhibitions",
    "Cultural Festivals",
    "Theater Performances",
    "Literature Festivals",
    "Historical Reenactments",
    "Art Installations",
    "Art Workshops & Competitions",
    "Guided Art Walks",
    "Printmaking & Conceptual Art",
    "Residency Showcases",
    "Art Auctions",
    "Poetry Readings",
    "Book Launch Events",
    "Author Meet & Greets",
    "Storytelling Sessions",
    "Film Screenings",
    "Short Film Festivals",
    "Heritage Walks",
    "Museum Tours",
    "Craft Fairs",
    "Handicraft Exhibitions",
    "Photography Exhibitions",
    "Sculpture Exhibitions",
    "Calligraphy Workshops",
    "Creative Writing Workshops",
    "Drama Workshops",
    "Open Mic Poetry Nights",
    "Comic Cons",
    "Zine Fairs",
    "Cultural Parades",
    "Traditional Dance Performances",
    "Folk Art Festivals",
    "Literary Debates",
    "Panel Discussions",
    "Cultural Conferences",
  ],
  Music: [
    "Concerts",
    "Music Festivals",
    "Live Performances",
    "Battle of the Bands",
    "DJ Nights",
    "Karaoke Nights",
    "Open Mics & Jam Sessions",
    "Acoustic Nights",
    "Album Launch Events",
    "Music Tours",
    "Symphony Orchestra Performances",
    "Opera Shows",
    "Choir Performances",
    "Tribute Shows",
    "Music Competitions",
    "Band Nights",
    "Indie Music Shows",
    "Rap Battles",
    "Electronic Dance Music (EDM) Events",
    "Classical Music Concerts",
    "Folk Music Events",
    "Cultural Music Nights",
    "Music Workshops",
    "Music Masterclasses",
    "Instrumental Recitals",
    "Music Award Shows",
    "Street Music Performances",
    "Unplugged Sessions",
    "Live Recording Sessions",
  ],
  "Entertainment & Performing Arts": [
    "Comedy Shows",
    "Magic Shows",
    "Circus Performances",
    "Stand up Comedy",
    "Improv Shows",
    "Drama Plays",
    "Musical Theatre",
    "Dance Performances",
    "Ballet Shows",
    "Street Performances",
    "Puppet Shows",
    "Mime Acts",
    "Talent Shows",
    "Reality Show Auditions",
    "Award Ceremonies",
    "Live Game Shows",
    "Variety Shows",
    "Flash Mob",
    "Stunt Shows",
    "Illusion Shows",
    "Drag Shows",
    "Burlesque Shows",
    "Carnival Performances",
    "Theme Park Shows",
    "Interactive Theatre",
    "Monologue Performances",
    "Storytelling Performances",
    "Cultural Stage Shows",
    "Broadway style Productions",
  ],
  Dance: [
    "Recitals & Showcases",
    "Competitions & Galas",
    "Social Dance",
    "Dance Workshops",
    "Themed Dances",
    "Classical Dance",
    "Contemporary Dance",
    "Street & Urban Dance",
    "Bollywood & Tollywood Dance",
    "Folk & Traditional Dance",
    "K-pop Dance",
    "Ballet Performances",
    "Hip-Hop Battles",
    "Salsa & Bachata Nights",
    "Zumba Sessions",
    "Dance Marathons",
    "Flash Mob",
    "Dance Reality Show Auditions",
    "Choreography Showcases",
    "Intercollegiate Dance Fests",
    "Couples Dance Competitions",
    "Freestyle Dance Battles",
    "Latin Dance Festivals",
    "Ballroom Dance Competitions",
    "Breakdance",
    "Dance Fitness Events",
    "Garba & Dandiya Nights",
    "Fusion Dance Shows",
    "Dance Retreats",
    "International Dance Festivals",
    "Dance Film Screenings",
  ],
  "Sports, Fitness, & Adventure": [
    "Sporting Competitions",
    "Marathons & Races",
    "Fitness Workshops",
    "Adventure Sports",
    "Camping & Hiking",
    "Turf Booking",
    "Wrestling",
    "Esports",
    "Cycling Events",
    "Triathlons",
    "Swimming Meets",
    "Football",
    "Cricket",
    "Badminton",
    "Basketball",
    "Volleyball Matches",
    "Table Tennis",
    "Kabaddi",
    "Athletics Meets",
    "Gymnastics Competitions",
    "Bodybuilding Championships",
    "CrossFit Competitions",
    "Yoga Retreats",
    "Meditation Camps",
    "Rock Climbing Events",
    "Trekking Expeditions",
    "Mountain Biking",
    "Surfing Competitions",
    "Skateboarding Events",
    "Self-Defense Workshops",
    "Martial Arts Tournaments",
    "Boxing Matches",
    "MMA Fights",
    "Car & Bike Rallies",
    "Motorsport Racing",
    "Obstacle Course Races",
    "Adventure Bootcamps",
    "Outdoor Survival Camps",
    "Fishing Tournaments",
    "Horse Riding",
  ],
  "Motorsport Racing": [
    "Formula Racing",
    "Stock Car Racing",
    "Touring Car Championships",
    "Motorcycle Grand Prix",
    "Superbike Racing",
    "Motocross Events",
    "Mud racing",
    "Endurance Racing",
    "Drag Racing",
    "Street Circuit Racing",
    "Rally Racing",
    "Rallycross Events",
    "Karting Championships",
    "Go-Kart Races",
    "Drift Competitions",
    "Time Attack Events",
    "Hill Climb Races",
    "Off-Road Racing",
    "Desert Rally",
    "Autocross Events",
    "Track Day Events",
    "Time Trial Races",
    "Electric Vehicle Racing",
    "Vintage Car Racing",
    "Truck Racing",
    "Speedway Racing",
    "Ice Racing",
    "Demolition Derby",
    "Burnout Competitions",
    "Motorsport Exhibitions",
    "Custom Car Shows",
    "Auto Expos",
    "Motorcycle Stunt Shows",
    "Supercar Meetups",
    "4x4 Off-Road Challenges",
    "ATV Racing",
    "Jet Ski Racing",
    "Boat Racing",
    "Drone Racing League Events",
    "Sim Racing Tournaments",
  ],
  "Education & Learning": [
    "Workshop",
    "Seminar",
    "Technological learning",
    "Conferences & Summits",
    "Academic Competitions & MUNs",
    "Career Fairs & Counseling",
    "Public Lectures",
    "Bootcamps",
    "Certification Programs",
    "College Fests",
    "Webinars",
    "Startup Competitions",
    "Quiz Sessions",
    "Hackathons",
    "Coding Competitions",
    "Research Paper Presentations",
    "Science Fairs",
    "Robotics Competitions",
    "Debate Competitions",
    "Group Discussions",
    "Language Learning Sessions",
    "Skill Development Programs",
    "Teacher Training Programs",
    "Leadership Workshops",
    "Entrepreneurship Workshops",
    "Industry Networking Events",
    "Internship Drives",
    "Educational Expos",
    "Study Abroad Fairs",
    "Alumni Meetups",
    "Innovation Challenges",
    "Case Study Competitions",
    "Design Thinking Workshops",
    "Data Science Workshops",
    "AI & ML Bootcamps",
    "Financial Literacy Workshops",
    "Exam Preparation Sessions",
    "Scholarship Awareness Programs",
  ],
  "Business & Innovation": [
    "Tech Expos",
    "Hackathons",
    "Product Launches",
    "Robotics Competitions",
    "Startup Events",
    "Trade Shows",
    "Networking Events",
    "Business Conferences",
    "Entrepreneurship Summits",
    "Investor Pitch Nights",
    "Venture Capital Meetups",
    "Angel Investor Forums",
    "Industry Panel Discussions",
    "Corporate Meetups",
    "B2B Meetings",
    "B2C Expos",
    "Innovation Showcases",
    "Startup Demo Days",
    "Incubator & Accelerator Programs",
    "Business Workshops",
    "Leadership Summits",
    "Marketing Conferences",
    "Sales Bootcamps",
    "E-commerce Expos",
    "FinTech Conferences",
    "AI & Tech Conferences",
    "Blockchain Summits",
    "SaaS Conferences",
    "Manufacturing Expos",
    "Franchise Exhibitions",
    "Business Award Ceremonies",
    "Corporate Training Programs",
    "Strategic Planning Workshops",
    "Business Networking Breakfasts",
    "Women in Business Events",
    "Young Entrepreneur Meetups",
  ],
  "Food, Lifestyle, & Wellness": [
    "Food Festivals",
    "Wine Tastings",
    "Cooking Classes",
    "Yoga & Spiritual Retreats",
    "Mindfulness Workshops",
    "Fashion Shows",
    "Street Food Carnivals",
    "Baking Workshops",
    "Barista Workshops",
    "Cocktail Making Classes",
    "Beer Festivals",
    "Organic Food Markets",
    "Farmers Markets",
    "Vegan & Plant-Based Expos",
    "Health & Wellness Expos",
    "Meditation Sessions",
    "Sound Healing Sessions",
    "Ayurveda Workshops",
    "Nutrition Seminars",
    "Diet & Weight Loss Programs",
    "Fitness Retreats",
    "Spa & Detox Retreats",
    "Beauty & Skincare Workshops",
    "Makeup Masterclasses",
    "Personal Styling Sessions",
    "Sustainable Living Workshops",
    "Zero-Waste Lifestyle Events",
    "Home & Living Expos",
    "Interior Design Exhibitions",
    "Pet Wellness Events",
    "Holistic Healing Fairs",
    "Self-Care Workshops",
    "Mental Health Awareness Events",
    "Tea & Coffee Festivals",
    "Luxury Lifestyle Exhibitions",
  ],
  "Film, Media, & Gaming": [
    "Film Festivals & Screenings",
    "Animation Showcases",
    "Board Game Nights",
    "Cosplay Conventions",
    "Movie Premieres",
    "Short Film Competitions",
    "Documentary Screenings",
    "Film Festivals",
    "Web Series Launches",
    "Fan Meetups",
    "Celebrity Meet & Greets",
    "Comic Cons",
    "Gaming Tournaments",
    "Esports Championships",
    "LAN Parties",
    "Game Launch Events",
    "Game Development Conferences",
    "VR & AR Experience Events",
    "Streaming & Content Creator Meetups",
    "Podcast Live Shows",
    "Photography Exhibitions",
    "Media & Journalism Conferences",
    "Film Making Workshops",
    "Script Writing Workshops",
    "Dubbing & Voice Acting Workshops",
    "Trailer Launch Events",
    "Red Carpet Events",
    "Movie Marathons",
    "Retro Film Nights",
    "Arcade Gaming Events",
    "Tabletop RPG Sessions",
    "Speedrunning Competitions",
    "Digital Art Showcases",
  ],
  "Travel, Holidays, & Tourism": [
    "Travel Expos",
    "Destination Showcases",
    "Cruise Events",
    "Holiday Events",
    "Adventure Travel Meetups",
    "Backpacking Workshops",
    "Travel Photography Tours",
    "Cultural Exchange Programs",
    "Visa & Immigration Seminars",
    "Study Abroad Tours",
    "Luxury Travel Exhibitions",
    "Road Trip Rallies",
    "Van Life Gatherings",
    "Eco-Tourism Conferences",
    "Wildlife Safari Trips",
    "Heritage Walks",
    "City Tours & Guided Walks",
    "Island Hopping Tours",
    "Mountain Expedition Trips",
    "Beach Festivals",
    "Travel Blogger Meetups",
    "Travel Storytelling Sessions",
    "Pilgrimage Tours",
    "Spiritual Travel Retreats",
    "Ski Trips & Snow Tours",
    "Desert Camping Experiences",
    "International Tourism Fairs",
    "Travel Deal Fairs",
    "Staycation Events",
    "Theme Park Tours",
    "Culinary Tourism Tours",
    "Festival Tourism Packages",
    "Volunteer Travel Programs",
    "Cultural Immersion Camps",
    "Photography Expeditions",
  ],
  "Festivals & Celebrations": [
    "National & Regional Festivals",
    "Harvest Festivals",
    "Lantern Festivals",
    "Cultural Parades",
    "Religious Festivals",
    "Music & Arts Festivals",
    "Food & Drink Festivals",
    "Film Festivals",
    "Flower Festivals",
    "Winter Festivals",
    "Summer Festivals",
    "Spring Festivals",
    "Autumn Festivals",
    "Street Festivals",
    "Carnivals",
    "Fireworks Festivals",
    "Light & Sound Shows",
    "Heritage Festivals",
    "Folk Festivals",
    "Tribal Festivals",
    "Boat Festivals",
    "Desert Festivals",
    "Beach Festivals",
    "Cultural Heritage Days",
    "Community Fairs",
    "Anniversary Celebrations",
    "Foundation Day Celebrations",
    "Independence Day Celebrations",
    "New Year Celebrations",
    "Themed Costume Festivals",
    "International Cultural Festivals",
    "Charity Festivals",
    "Art & Craft Festivals",
    "Literary Festivals",
    "Spiritual Gatherings",
  ],
  "Environment, Sustainability, & Agriculture": [
    "Eco Festivals",
    "Sustainable Living Workshops",
    "Tree-Planting & Clean Energy Campaigns",
    "Agricultural Fairs & Farmers' Markets",
    "Green Hackathons",
    "Cyclothons",
    "Eco-Tourism Trails",
    "Green Tech Conferences",
    "Climate Action Summits",
    "Organic Farming Workshops",
    "Permaculture Training Programs",
    "Water Conservation Drives",
    "Beach Clean Up Campaigns",
    "River Restoration Projects",
    "Wildlife Conservation Camps",
    "Biodiversity Awareness Programs",
    "Urban Gardening Workshops",
    "Composting Workshops",
    "Zero-Waste Events",
    "Sustainable Fashion Shows",
    "Renewable Energy Expos",
    "Solar & Wind Energy Workshops",
    "Environmental Film Screenings",
    "Nature Walks & Bird Watching Tours",
    "Sustainable Architecture Expos",
    "Carbon Footprint Awareness Campaigns",
    "Green Startup Pitch Events",
    "Eco Innovation Challenges",
    "Community Recycling Drives",
    "Plastic-Free Campaigns",
    "Soil Health Awareness Programs",
    "Agri Tech Exhibitions",
    "Hydroponics & Aquaponics Workshops",
    "Seed Exchange Fairs",
    "Farm to Table Events",
  ],
  "Religious & Spiritual Events": [
    "Pilgrimages",
    "Spiritual Retreats",
    "Meditation Camps",
    "Prayer Meetings",
    "Bhajan & Kirtan Nights",
    "Satsang Gatherings",
    "Religious Discourses",
    "Scripture Study Sessions",
    "Interfaith Dialogues",
    "Spiritual Workshops",
    "Healing & Blessing Sessions",
    "Temple Festivals",
    "Church Conventions",
    "Mosque Gatherings",
    "Ashram Retreats",
    "Silent Retreats",
    "Chanting Sessions",
    "Spiritual Conferences",
    "Youth Spiritual Camps",
    "Faith Based Charity Events",
    "Religious Processions",
    "Holy Day Celebrations",
    "Spiritual Counseling Sessions",
    "Energy Healing Workshops",
    "Yoga & Philosophy Sessions",
    "Vedic Ritual Ceremonies",
    "Baptism Ceremonies",
    "Ramadan Iftar Gatherings",
    "Gospel Music Nights",
    "Community Prayer Breakfasts",
  ],
  "Night Life": [
    "Clubbing",
    "Themed Parties",
    "Karaoke Nights",
    "DJ Nights",
    "Pubbing",
    "Rave Parties",
    "After Parties",
    "Ladies' Night",
    "Gentlemen's Night",
    "Neon Glow Parties",
    "Retro Nights",
    "Bollywood Nights",
    "EDM Nights",
    "Hip Hop Nights",
    "Latin Dance Nights",
    "Salsa Nights",
    "Beach Parties",
    "Pool Parties",
    "Rooftop Parties",
    "Live Band Nights",
    "Open Mic Nights",
    "Stand up Comedy Nights",
    "Drag Nights",
    "Silent Disco",
    "Masquerade Balls",
    "Casino Nights",
    "Cocktail Nights",
    "Wine & Dine Nights",
    "Pub Crawls",
    "Bar Hopping Events",
    "Midnight Movie Screenings",
    "Game & Trivia Nights",
    "Foam Parties",
    "Full Moon Parties",
    "Singles Mixers",
  ],
  Other: ["Other"],
};

export const EVENT_CATEGORIES = [
  "Arts, Culture, & Literature",
  "Music",
  "Entertainment & Performing Arts",
  "Dance",
  "Sports, Fitness, & Adventure",
  "Motorsport Racing",
  "Education & Learning",
  "Business & Innovation",
  "Food, Lifestyle, & Wellness",
  "Film, Media, & Gaming",
  "Travel, Holidays, & Tourism",
  "Festivals & Celebrations",
  "Environment, Sustainability, & Agriculture",
  "Religious & Cultural Events",
  "Night Life",
  "Other",
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
