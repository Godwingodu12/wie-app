import express from 'express';
import Attendance from '../models/attendance.model.js';
import Ticket from '../models/ticket.model.js';
import { verifyBookingQR } from '../grpc/bookingClient.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      console.error('JWT_SECRET or ACCESS_TOKEN_SECRET is not defined.');
      return res.status(500).json({ success: false, message: 'Server configuration error: JWT secret missing.' });
    }
    const decoded = jwt.default.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

const decodeQRPayload = (qrData) => {
  if (!qrData || typeof qrData !== 'string') return null;
  const trimmed = qrData.trim();
  // Format 1: base64-encoded JSON (current — from generateQRCode)
  try {
    // Strip any surrounding whitespace or data-URL prefix a misbehaving scanner might add
    let b64 = trimmed.replace(/^data:[^,]+,/, '');
    // Normalize URL-safe base64 (+ vs -, / vs _) and fix padding
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad === 2) b64 += '==';
    else if (pad === 3) b64 += '=';
    const raw = Buffer.from(b64, 'base64').toString('utf-8');
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.bookingId) return parsed;
    }
  } catch { /* not valid base64 JSON */ }

  // ── Format 2: plain JSON string (some legacy tickets) 
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.bookingId) return parsed;
    } catch { /* not valid JSON */ }
  }

  // ── Format 3: multiline text (old legacy format) 
  const get = (label) => {
    const m = trimmed.match(new RegExp(`${label}:\\s*([^\\n\\r]+)`, 'i'));
    return m ? m[1].trim() : '';
  };
  const bookingId = get('Booking ID');
  if (bookingId) {
    return {
      bookingId,
      userId: '',
      ticketId: '',
      eventName: get('Event'),
      ticketType: get('Ticket Type') || get('Ticket'),
      quantity: Number(get('Quantity')) || 1,
      holderName: get('Booked By'),
      eventDate: get('Date'),
      eventTime: get('Time'),
      venue: get('Location') || get('Venue'),
      paymentMethod: get('Payment'),
      totalAmount: Number((get('Total Price') || '0').replace(/[^\d.]/g, '')) || 0,
      v: 0,
    };
  }
  return null;
};

// ── Helper: pull the correct totalBooked from a ticket document 
const resolveTotalBooked = (ticket, subEventId) =>
  subEventId
    ? (ticket.sub_events?.find(s => s._id.toString() === subEventId)?.totalBookings || 0)
    : (ticket.totalBookings || 0);

// ── Helper: pull the correct event name from a ticket document 
const resolveEventName = (ticket, subEventId) =>
  subEventId
    ? ticket.sub_events?.find(s => s._id.toString() === subEventId)?.event_name
    : ticket.event_name;

const markAttendance = async ({ ticketId, subEventId = null, qrData, scannedBy }) => {
  // ── Step 1: Decode QR locally first (fast, no network) 
  const decodedPayload = decodeQRPayload(qrData);

  if (!decodedPayload || !decodedPayload.bookingId) {
    throw new Error('Invalid QR code — could not decode payload');
  }

  // ── Step 2: Verify via gRPC (authoritative booking lookup) 
  console.log(`[Attendance] Decoded bookingId: ${decodedPayload.bookingId}, ticketId from URL: ${ticketId}`);

  const qrResult = await verifyBookingQR(qrData);
  console.log(`[Attendance] gRPC verifyBookingQR result:`, JSON.stringify(qrResult));

  // Handle both flat (new proto) and nested (old proto) response shapes
  const flat = qrResult?.booking
    ? { ...qrResult, ...qrResult.booking }
    : qrResult;

  if (!flat || !flat.success) {
    const errMsg = flat?.error || 'Invalid or cancelled QR code';
    console.error(`[Attendance] QR verification failed: ${errMsg}`);
    throw new Error(errMsg);
  }

  // ── Verify this QR belongs to the correct event 
  // flat.ticketId is the event the booking was made for
  // ticketId (URL param) is the event the hoster is scanning for
  if (flat.ticketId && ticketId && flat.ticketId.toString() !== ticketId.toString()) {
    console.warn(`[Attendance] TicketId mismatch: QR has ${flat.ticketId}, scanner is for ${ticketId}`);
    throw new Error('This QR code does not belong to this event');
  }
  // externalId is the human-readable booking ID (e.g. "BK17...") — use this as the stable ref
  // flat.bookingId is the Prisma UUID — only used internally
  const bookingRef = flat.externalId || decodedPayload.bookingId;

  const existing = await Attendance.findOne({
    ticketId,
    subEventId: subEventId || null,
    $or: [
      { 'attendees.bookingId': bookingRef },
      { 'attendees.transactionId': bookingRef },
    ],
  });
  if (existing) {
    throw new Error('This ticket has already been scanned for attendance');
  }

  // ── Step 4: Load ticket for totalBooked 
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error('Event not found');

  const totalBooked = resolveTotalBooked(ticket, subEventId);

  // ── Step 5: Build attendee record — prefer gRPC data, fall back to QR
  const attendeeRecord = {
    bookingId: bookingRef,          // always the human-readable "BK..." id
    userId: flat.userId || decodedPayload.userId || '',
    userName: flat.userName || decodedPayload.holderName || '',
    holderName: decodedPayload.holderName || flat.userName || '',
    userEmail: flat.userEmail || decodedPayload.userEmail || '',
    userPhone: flat.userPhone || decodedPayload.userPhone || '',
    ticketType: flat.ticketType || decodedPayload.ticketType || '',
    quantity: flat.quantity || decodedPayload.quantity || 1,
    paymentMethod: flat.paymentMethod || decodedPayload.paymentMethod || '',
    transactionId: bookingRef,      // same — for display in the list
    eventName: flat.eventName || decodedPayload.eventName || '',
    eventDate: flat.eventDate || decodedPayload.eventDate || '',
    eventTime: flat.eventTime || decodedPayload.eventTime || '',
    venue: flat.venue || decodedPayload.venue || '',
    totalAmount: (flat.totalAmount && flat.totalAmount > 0)
      ? flat.totalAmount
      : (decodedPayload.totalAmount ?? 0),
    subtotal: (flat.subtotal && flat.subtotal > 0)
      ? flat.subtotal
      : (decodedPayload.subtotal ?? 0),
    scannedAt: new Date(),
    scannedBy,
    status: 'present',
    qrData,
    subEventId: subEventId || null,
  };

  // ── Step 6: Upsert attendance document
  const attendance = await Attendance.findOneAndUpdate(
    { ticketId, subEventId: subEventId || null },
    {
      $push: { attendees: attendeeRecord },
      $inc: { totalPresent: 1 },
      $setOnInsert: {
        eventName: resolveEventName(ticket, subEventId),
        totalBooked,
        startedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return { attendance, scannedAttendee: attendeeRecord };
};

// ── POST /attendance/:ticketId/init ───────────────────────────────────────────
// Creates (or no-ops if already exists) the attendance session for an event.
router.post('/:ticketId/init', authenticate, async (req, res) => {
  try {
    const { subEventId } = req.body;

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Event not found' });

    const totalBooked = resolveTotalBooked(ticket, subEventId);

    const attendance = await Attendance.findOneAndUpdate(
      { ticketId: req.params.ticketId, subEventId: subEventId || null },
      {
        $setOnInsert: {
          eventName: resolveEventName(ticket, subEventId),
          totalBooked,
          totalPresent: 0,
          attendees: [],
          startedAt: new Date(),
          isCompleted: false,
          markedBy: req.user._id || req.user.id,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── POST /attendance/:ticketId/scan
// Scan a QR code and mark an attendee as present.
router.post('/:ticketId/scan', authenticate, async (req, res) => {
  try {
    const { qrData: rawQrData, qrPayload: rawQrPayload, subEventId } = req.body;
    const qrData = rawQrData || rawQrPayload;
    if (!qrData) return res.status(400).json({ success: false, message: 'qrData is required' });

    const result = await markAttendance({
      ticketId: req.params.ticketId,
      subEventId: subEventId || null,
      qrData,
      scannedBy: req.user._id || req.user.id,
    });

    const qrPayload = decodeQRPayload(qrData);

    const enrichedAttendee = {
      ...result.scannedAttendee,
      // Ensure all display fields are populated for the scanner UI
      holderName: qrPayload?.holderName || result.scannedAttendee?.userName || '',
      eventName: qrPayload?.eventName || result.scannedAttendee?.eventName || '',
      ticketType: qrPayload?.ticketType || result.scannedAttendee?.ticketType || '',
      quantity: qrPayload?.quantity ?? result.scannedAttendee?.quantity ?? 1,
      eventDate: qrPayload?.eventDate || result.scannedAttendee?.eventDate || '',
      eventTime: qrPayload?.eventTime || result.scannedAttendee?.eventTime || '',
      venue: qrPayload?.venue || result.scannedAttendee?.venue || '',
      paymentMethod: qrPayload?.paymentMethod || result.scannedAttendee?.paymentMethod || '',
      totalAmount: qrPayload?.totalAmount ?? 0,
      bookingRef: qrPayload?.bookingId || result.scannedAttendee?.bookingId || '',
      scannedAt: result.scannedAttendee?.scannedAt || new Date(),
      qrPayload,
    };

    res.status(200).json({
      success: true,
      data: { ...result, scannedAttendee: enrichedAttendee },
    });
  } catch (err) {
    // Return correct HTTP status for already-scanned tickets
    const alreadyScanned = err.message.includes('already been scanned');
    const status = alreadyScanned ? 409 : 400;
    res.status(status).json({
      success: false,
      message: err.message,
      alreadyScanned,
    });
  }
});

// ── GET /attendance/:ticketId 
// Fetch the full attendance record for an event (or sub-event).
router.get('/:ticketId', authenticate, async (req, res) => {
  try {
    const { subEventId } = req.query;
    const attendance = await Attendance.findOne({
      ticketId: req.params.ticketId,
      subEventId: subEventId || null,
    });
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance session found' });
    }
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PATCH /attendance/:ticketId/complete ──────────────────────────────────────
// Mark the attendance session as completed / closed.
router.patch('/:ticketId/complete', authenticate, async (req, res) => {
  try {
    const { subEventId } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { ticketId: req.params.ticketId, subEventId: subEventId || null },
      { $set: { isCompleted: true, completedAt: new Date() } },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance session found' });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /attendance/:ticketId/attendee/:bookingId ──────────────────────────
// Remove a mistakenly scanned attendee (undo scan).
router.delete('/:ticketId/attendee/:bookingId', authenticate, async (req, res) => {
  try {
    const { subEventId } = req.query;
    const { bookingId } = req.params;

    const attendance = await Attendance.findOne({
      ticketId: req.params.ticketId,
      subEventId: subEventId || null,
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance session found' });
    }

    // Check the attendee actually exists before decrementing
    const attendeeExists = attendance.attendees.some(
      (a) => a.bookingId?.toString() === bookingId
    );
    if (!attendeeExists) {
      return res.status(404).json({ success: false, message: 'Attendee not found in this session' });
    }

    const updated = await Attendance.findOneAndUpdate(
      { ticketId: req.params.ticketId, subEventId: subEventId || null },
      {
        $pull: { attendees: { bookingId } },
        $inc: { totalPresent: -1 },
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /attendance/:ticketId/download ────────────────────────────────────────
// Export attendance as Excel (.xlsx) or PDF.
router.get('/:ticketId/download', authenticate, async (req, res) => {
  try {
    const { subEventId, format = 'excel' } = req.query;

    const attendance = await Attendance.findOne({
      ticketId: req.params.ticketId,
      subEventId: subEventId || null,
    });
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance data found' });
    }

    const rows = attendance.attendees || [];
    const title = `Attendance — ${attendance.eventName || 'Event'}`;

    // ── PDF export ────────────────────────────────────────────────────────────
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance.pdf"');

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);

      // Title & summary
      doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' }).moveDown(0.5);
      doc.fontSize(10).font('Helvetica')
        .text(`Total Booked: ${attendance.totalBooked}   |   Present: ${attendance.totalPresent}   |   Status: ${attendance.isCompleted ? 'Completed' : 'Ongoing'}`, { align: 'center' })
        .moveDown(1);

      // Table header
      const cols = ['#', 'Name', 'Ticket Type', 'Qty', 'Payment', 'Transaction ID', 'Scanned At'];
      const widths = [25, 110, 90, 30, 70, 120, 90];
      let x = 40;
      const headerY = doc.y;

      doc.fontSize(9).font('Helvetica-Bold');
      cols.forEach((c, i) => {
        doc.text(c, x, headerY, { width: widths[i], lineBreak: false });
        x += widths[i];
      });

      doc.moveDown(0.3).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.font('Helvetica').fontSize(8);

      rows.forEach((att, idx) => {
        if (doc.y > 750) doc.addPage();
        x = 40;
        const rowY = doc.y + 4;
        const vals = [
          idx + 1,
          att.holderName || att.userName || att.userId,
          att.ticketType || '-',
          att.quantity,
          att.paymentMethod || '-',
          att.transactionId || att.bookingId,
          att.scannedAt ? new Date(att.scannedAt).toLocaleString() : '-',
        ];
        vals.forEach((v, i) => {
          doc.text(String(v), x, rowY, { width: widths[i], lineBreak: false });
          x += widths[i];
        });
        doc.moveDown(0.3);
      });

      doc.end();

      // ── Excel export ──────────────────────────────────────────────────────────
    } else {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Attendance');

      // Title row
      ws.mergeCells('A1:I1');
      const titleCell = ws.getCell('A1');
      titleCell.value = title;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };

      // Summary row
      ws.mergeCells('A2:I2');
      const summaryCell = ws.getCell('A2');
      summaryCell.value = `Total Booked: ${attendance.totalBooked}   |   Present: ${attendance.totalPresent}   |   Status: ${attendance.isCompleted ? 'Completed' : 'Ongoing'}`;
      summaryCell.alignment = { horizontal: 'center' };
      summaryCell.font = { italic: true, size: 10 };

      ws.addRow([]); // spacer

      // Column headers
      const header = ws.addRow(['#', 'Name', 'Email', 'Phone', 'Ticket Type', 'Qty', 'Payment Method', 'Transaction ID', 'Scanned At']);
      header.font = { bold: true };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8FF' } };
      header.alignment = { horizontal: 'center' };

      ws.columns = [
        { width: 5 },
        { width: 22 },
        { width: 28 },
        { width: 16 },
        { width: 18 },
        { width: 6 },
        { width: 18 },
        { width: 28 },
        { width: 22 },
      ];

      // Data rows
      rows.forEach((att, idx) => {
        ws.addRow([
          idx + 1,
          att.holderName || att.userName || att.userId,
          att.userEmail || '-',
          att.userPhone || '-',
          att.ticketType || '-',
          att.quantity,
          att.paymentMethod || '-',
          att.transactionId || att.bookingId,
          att.scannedAt ? new Date(att.scannedAt).toLocaleString() : '-',
        ]);
      });

      // Zebra stripe the data rows for readability
      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 4 && rowNumber % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } };
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance.xlsx"');
      await wb.xlsx.write(res);
      res.end();
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
