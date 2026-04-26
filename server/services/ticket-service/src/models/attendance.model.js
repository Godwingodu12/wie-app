import mongoose from 'mongoose';

const attendeeRecordSchema = new mongoose.Schema({
  bookingId:      { type: String, required: true },
  userId:         { type: String, required: true },
  userName:       { type: String, default: '' },
  holderName:     { type: String, default: '' },
  userEmail:      { type: String, default: '' },
  userPhone:      { type: String, default: '' },
  ticketType:     { type: String, default: '' },
  quantity:       { type: Number, default: 1 },
  paymentMethod:  { type: String, default: '' },
  transactionId:  { type: String, default: '' },
  // Full ticket detail fields stored at scan time
  eventName:      { type: String, default: '' },
  eventDate:      { type: String, default: '' },
  eventTime:      { type: String, default: '' },
  venue:          { type: String, default: '' },
  totalAmount:    { type: Number, default: 0 },
  scannedAt:      { type: Date,   default: Date.now },
  scannedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:         { type: String, enum: ['present', 'absent'], default: 'present' },
  qrData:         { type: String },
  subEventId:     { type: String, default: null },
});

const attendanceSchema = new mongoose.Schema({
  ticketId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  subEventId:     { type: String, default: null },
  eventName:      { type: String },
  totalBooked:    { type: Number, default: 0 },
  totalPresent:   { type: Number, default: 0 },
  attendees:      [attendeeRecordSchema],
  isCompleted:    { type: Boolean, default: false },
  startedAt:      { type: Date },
  completedAt:    { type: Date },
  markedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

attendanceSchema.index({ ticketId: 1, subEventId: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
