import mongoose from 'mongoose';

// Guest Schema
const guestSchema = new mongoose.Schema({
  guest_name: { type: String },
  guest_profile: { type: String }, // Image URL
  guest_link: { type: String }, // Social media or website link
});

// Ticket Type Schema
const ticketTypeSchema = new mongoose.Schema({
  ticket_type: { type: String },
  ticket_price: { type: Number },
  ticket_photo: { type: String }, // Image URL
  max_capacity: { type: Number },
});

// Banking Details Schema
const bankingDetailsSchema = new mongoose.Schema({
  bank_acc_type: { type: String },
  bank_acc_no: { type: String },
  bank_ifsc: { type: String },
  bank_acc_holder: { type: String },
});

const offerTicketSchema = new mongoose.Schema({
  offer_ticket_type: { type: String, required: false },
  offer_ticket_price: { type: String, required: false },
  set_limit_for_user: { type: String, required: false },
  offer_ticket_pic: { type: String, required: false },
});

// POC Schema
const POCSchema = new mongoose.Schema({
  POC_name: { type: String, required: false },
  POC_email: { type: String, required: false },
  POC_contact: { type: String, required: false },
});

// File Schema for event rules
const fileSchema = new mongoose.Schema({
  type: { type: String, enum: ['file', 'text'], required: true },
  path: { type: String }, // For file type
  originalName: { type: String }, // For file type
  mimeType: { type: String }, // For file type
  size: { type: Number }, // For file type
  content: { type: String }, // For text type
  uploadedAt: { type: Date, default: Date.now }
});

// Main Ticket Schema (Event)
const ticketSchema = new mongoose.Schema({
  // Basic Information
  event_name: { type: String, required: false },
  event_category: { type: String, required: false },
  event_subcategory: { type: String, required: false },
  event_type: { type: String, required: false },
  
  // FIXED: Changed from String to Array of Strings
  event_language: [{ 
    type: String, 
    enum: ['English','Hindi','Malayalam','Tamil','Kannada','Telugu','Marathi','Gujarati','Punjabi','Urdu','Bengali','Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Russian','Turkish','Korean', 'Portuguese', 'Arabic','Indonesian','Vietnamese','Other']
  }],
  
  min_age_allowed: { type: Number, required: true },
  seating_arrangement: { type: String, default: false, enum: ['seated', 'standing','seated and standing','other']},
  kids_friendly: { type: Boolean, default: false },
  pet_friendly: { type: Boolean, default: false },
  
  // Location
  location: { type: String, required: false },
  venue: { type: String, required: false },
  exact_map_location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  
  // Date and Time
  event_date_type: { type: String, enum: ['one-day', 'multi-day', 'weekly'], required: true },
  start_date: { type: Date, required: false },
  end_date: { type: Date },
  start_time: { type: String, required: false },
  end_time: { type: String, required: false },
  event_instagram_link: { type: String, required: false },
  gate_open_time: { type: String, required: false },
  event_youtube_link: { type: String, required: false },
  
  // FIXED: Changed from String to Object using fileSchema
  event_rules: fileSchema,
  
  prohibited_items: [{ type: String }], // Array of prohibited items
  
  // Description and Media
  college_authorisation: { type: String, required: false },
  event_description: { type: String, required: false },
  event_logo: { type: String, required: false },
  event_banner: { type: String, required: false },
  
  // Guest profile for single guest
  guest_profile: {
    path: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
  },
  
  event_images: [{
    path: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }], // Array of image objects (max 10)
  
  // Event Details
  hashtag: [{ type: String }], // Array of hashtags
  payment_type: { type: String, enum: ['free', 'paid'], required: false },
  
  // Banking Details (can have multiple for main event)
  banking_details: [bankingDetailsSchema],
  
  // Multiple Guests, Guides, and Ticket Types
  guests: [guestSchema], // This remains as array of objects
  POCS: [POCSchema],
  total_capacity: { type: String, required: false },
  booking_start_date: { type: String, required: false },
  booking_end_date: { type: String, required: false },
  ticket_types: [ticketTypeSchema],
  created_by: { type: String, required: false },
  
  //ticket offer or bulk booking
  event_ticket_offer: { type: Boolean, default: false },
  offerTickets: [offerTicketSchema],
  
  // References
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreateGroup', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Status and Updates
  event_status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_at: { type: Date, default: Date.now },
  
  // Form Progress Tracking
  form_progress: {
    basic_info: { type: Boolean, default: false },
    media: { type: Boolean, default: false },
    add_on_events: { type: Boolean, default: false },
    banking_tickets: { type: Boolean, default: false },
    terms_conditions: { type: Boolean, default: false },
  },
  
  // Terms and Conditions (Company provided)
  terms_accepted: { type: Boolean, default: false },
  terms_accepted_at: { type: Date },
  company_terms_version: { type: String }, // Track which version of terms was accepted
}, {
  timestamps: true
});

// Sub Event Schema (for add-on events)
const subEventSchema = new mongoose.Schema({
  event_name: { type: String, required: true },
  event_category: { type: String, required: true },
  event_subcategory: { type: String, required: true },
  event_type: { type: String, required: true,enum: ['private', 'public']},
  
  // FIXED: Changed from String to Array for sub events too
  event_language: [{ 
    type: String, 
    enum: ['English','Hindi','Malayalam','Tamil','Kannada','Telugu','Marathi','Gujarati','Punjabi','Urdu','Bengali','Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Russian','Turkish','Korean', 'Portuguese', 'Arabic','Indonesian','Vietnamese','Other']
  }],
  
  min_age_allowed: { type: Number, required: true },
  seating_arrangement: { type: String, default: false, enum: ['seated', 'standing','seated and standing','other']},
  kids_friendly: { type: Boolean, default: false },
  pet_friendly: { type: Boolean, default: false },
  location: { type: String, required: true },
  venue: { type: String, required: true },
  exact_map_location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  
  // Date and Time
  event_date_type: { type: String, enum: ['one-day', 'multi-day', 'weekly'], required: false },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  start_time: { type: String, required: true },
  end_time: { type: String },
  event_instagram_link: { type: String, required: false },
  event_youtube_link: { type: String, required: false },
  
  // FIXED: Changed from String to Object for sub events too
  event_rules: fileSchema,
  
  POCS: [POCSchema],
  prohibited_items: [{ type: String }], // Array of prohibited items
  
  // Description and Media
  event_description: { type: String, required: true },
  event_logo: { type: String, required: true },
  event_banner: { type: String, required: true },
  event_images: [{
      path: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      mimeType: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],  
  
  // Event Details
  hashtag: [{ type: String }], // Array of hashtags
  payment_type: { type: String, enum: ['free', 'paid'], required: true },
  
  // Banking Details for sub-events
  banking_details: [bankingDetailsSchema],
  
  // Multiple Guests, Guides, and Ticket Types for sub-events
  guests: [guestSchema],
  ticket_types: [ticketTypeSchema],
  
  // Status
  event_status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'live'],
    default: 'pending'
  },
}, { timestamps: true });
// Indexes for better performance
ticketSchema.index({ groupId: 1, userId: 1 });
ticketSchema.index({ event_status: 1 });
ticketSchema.index({ start_date: 1 });
ticketSchema.index({ event_category: 1, event_subcategory: 1 });
const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
