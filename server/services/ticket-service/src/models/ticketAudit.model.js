import mongoose from 'mongoose';
// Stores immutable snapshots of cancelled event metrics for audit/financial records
const ticketAuditSchema = new mongoose.Schema({
  // Link back to the original ticket (never deleted)
  original_ticket_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  },
  // Link to the new V2 ticket created after rehost (for dashboard versioning)
  rehosted_ticket_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null,
  },
  // Who owns this event
  userId: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'User',
    default: null,
  },
  groupId: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'Group',
    default: null,
  },

  // Version number (1 = first cancellation, 2 = second, etc.)
  version: { type: Number, required: true, default: 1 },

  // Whether this is a sub-event audit record
  is_sub_event:     { type: Boolean, default: false },
  sub_event_id:     { type: mongoose.Schema.Types.ObjectId, default: null },
  parent_ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },

  // EVENT STRUCTURE SNAPSHOT (read-only historical record)
  event_structure: {
    event_name:        { type: String },
    event_category:    { type: String },
    event_subcategory: { type: String },
    event_type:        { type: String },
    event_description: { type: String },
    event_banner:      { type: String },
    event_logo:        { type: String },
    location:          { type: String },
    location_type:     { type: String },
    venue:             { type: String },
    payment_type:      { type: String },
    event_dates:       { type: mongoose.Schema.Types.Mixed },
    ticket_types:      { type: mongoose.Schema.Types.Mixed },
    sub_events_count:  { type: Number, default: 0 },
  },

  // FROZEN LIFECYCLE METRICS (immutable after snapshot)
  metrics_snapshot: {
    like:                { type: Number, default: 0 },
    share:               { type: Number, default: 0 },
    totalBookings:       { type: Number, default: 0 },
    totalTicketsSold:    { type: Number, default: 0 },
    revenue:             { type: Number, default: 0 },
    total_cancellation:  { type: Number, default: 0 },
    total_refund_amount: { type: Number, default: 0 },
  },

  // CANCELLATION DETAILS
  cancelled_at:        { type: Date, required: true },
  cancelled_by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellation_reason: { type: String, default: '' },
  refund_percentage:   { type: Number, default: 100 },
  cancellation_tier:   { type: String, default: 'full_refund' },

  // LOCK FLAG (once set true, no field should ever change)
  is_locked: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Prevent updates to locked audit records
ticketAuditSchema.pre('save', function (next) {
  if (!this.isNew && this.is_locked) {
    return next(new Error('Audit records are immutable and cannot be modified'));
  }
  next();
});

// Single source of truth for all indexes — no inline index:true above
ticketAuditSchema.index({ original_ticket_id: 1, version: 1 });
ticketAuditSchema.index({ original_ticket_id: 1, sub_event_id: 1 }); 
ticketAuditSchema.index({ userId: 1, cancelled_at: -1 });
ticketAuditSchema.index({ groupId: 1 });

const TicketAudit = mongoose.model('TicketAudit', ticketAuditSchema);
export default TicketAudit;
