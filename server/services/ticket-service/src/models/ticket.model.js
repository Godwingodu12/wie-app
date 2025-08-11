import mongoose from 'mongoose';
// Guest Schema
const guestSchema = new mongoose.Schema({
  guest_name: { type: String },
  guest_profile: { type: String }, // Image URL
  guest_link: { type: String }, // Social media or website link
});
// Guide Schema
const guideSchema = new mongoose.Schema({
  guide_name: { type: String },
  guide_profile: { type: String }, // Image URL
  guide_link: { type: String }, // Contact or profile link
});
// Ticket Type Schema
const ticketTypeSchema = new mongoose.Schema({
  ticket_type: { type: String },
  ticket_price: { type: Number },
  ticket_photo: { type: String }, // Image URL
  max_capacity: { type: Number },
  seating_arrangement: { type: Boolean, default: false },
});

// Banking Details Schema
const bankingDetailsSchema = new mongoose.Schema({
  bank_acc_type: { type: String },
  bank_acc_no: { type: String },
  bank_ifsc: { type: String },
  bank_acc_holder: { type: String },
});

// Sub Event Schema (for add-on events)
const subEventSchema = new mongoose.Schema({
  event_name: { type: String, required: true },
  event_category: { type: String, required: true },
  event_subcategory: { type: String, required: true },
  event_type: { type: String, required: true },
  location: { type: String, required: true },
  venue: { type: String, required: true },
  exact_map_location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  
  // Date and Time
  event_date_type: { type: String, enum: ['one-day', 'multi-day', 'specific-dates'], required: false },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  start_time: { type: String, required: true },
  end_time: { type: String },
  
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
  guides: [guideSchema],
  ticket_types: [ticketTypeSchema],
  
  // Status
  event_status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'live'],
    default: 'pending'
  },
}, { timestamps: true });

// Main Ticket Schema (Event)
const ticketSchema = new mongoose.Schema({
  // Basic Information
  event_name: { type: String, required: false },
  event_category: { type: String, required: false },
  event_subcategory: { type: String, required: false },
  event_type: { type: String, required: false },
  
  // Location
  location: { type: String, required: false },
  venue: { type: String, required: false },
  exact_map_location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  
  // Date and Time
  event_date_type: { type: String, enum: ['one-day', 'multi-day', 'specific-dates'], required: true },
  start_date: { type: Date, required: false },
  end_date: { type: Date },
  start_time: { type: String, required: false },
  end_time: { type: String, required: false },
  
  // Description and Media
  event_description: { type: String, required: false },
  event_logo: { type: String, required: false },
  event_banner: { type: String, required: false },
  
  // FIXED: Changed from [{ type: String }] to match the object structure you're saving
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
  guests: [guestSchema],
  guides: [guideSchema],
  ticket_types: [ticketTypeSchema],
  
  // Sub Events (Add-on Events)
  sub_events: [subEventSchema],
  
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
// Indexes for better performance
ticketSchema.index({ groupId: 1, userId: 1 });
ticketSchema.index({ event_status: 1 });
ticketSchema.index({ start_date: 1 });
ticketSchema.index({ event_category: 1, event_subcategory: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
