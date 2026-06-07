import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  markAttendance,
  getAttendance,
  initAttendance,
} from '../services/ticket.service.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();
router.use(protect);
// POST /attendance/:ticketId/init
router.post('/:ticketId/init', async (req, res) => {
  try {
    const { subEventId } = req.body;
    const attendance = await initAttendance(req.params.ticketId, subEventId || null);
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /attendance/:ticketId/scan
router.post('/:ticketId/scan', async (req, res) => {
  try {
    const { qrData, subEventId } = req.body;
    if (!qrData) return res.status(400).json({ success: false, message: 'qrData is required' });

    const result = await markAttendance({
      ticketId:   req.params.ticketId,
      subEventId: subEventId || null,
      qrData,
      scannedBy:  req.user._id,
    });

    // ── Decode the QR payload to return full ticket details alongside scan result ──
    // The QR string is base64(JSON(QRPayload)) — decode it here so the hoster
    // scanner and user view both receive the same structured data.
    let qrPayload = null;
    try {
      const decoded = Buffer.from(qrData, 'base64').toString('utf-8');
      if (decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded);
        if (parsed.bookingId) qrPayload = parsed;
      }
    } catch {
      // QR may be legacy format — qrPayload stays null, scannedAttendee has the data
    }

    // Merge qrPayload fields into scannedAttendee so the response is self-contained
    const enrichedAttendee = {
      ...result.scannedAttendee,
      // Prefer qrPayload values (richer) over what was stored in attendance record
      holderName:    qrPayload?.holderName    || result.scannedAttendee?.userName    || '',
      eventName:     qrPayload?.eventName     || '',
      ticketType:    qrPayload?.ticketType    || result.scannedAttendee?.ticketType  || '',
      quantity:      qrPayload?.quantity      ?? result.scannedAttendee?.quantity    ?? 1,
      eventDate:     qrPayload?.eventDate     || '',
      eventTime:     qrPayload?.eventTime     || '',
      venue:         qrPayload?.venue         || '',
      paymentMethod: qrPayload?.paymentMethod || result.scannedAttendee?.paymentMethod || '',
      totalAmount:   qrPayload?.totalAmount   ?? 0,
      bookingRef:    qrPayload?.bookingId     || result.scannedAttendee?.bookingId   || '',
      qrPayload,
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        scannedAttendee: enrichedAttendee,
      },
    });
  } catch (err) {
    const status = err.message.includes('already been scanned') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// GET /attendance/:ticketId
router.get('/:ticketId', async (req, res) => {
  try {
    const { subEventId } = req.query;
    const attendance = await getAttendance(req.params.ticketId, subEventId || null);
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /attendance/:ticketId/download?format=pdf|excel
router.get('/:ticketId/download', async (req, res) => {
  try {
    const { subEventId, format = 'excel' } = req.query;
    const attendance = await getAttendance(req.params.ticketId, subEventId || null);
    if (!attendance) return res.status(404).json({ success: false, message: 'No attendance data found' });

    const rows = attendance.attendees || [];
    const title = `Attendance — ${attendance.eventName || 'Event'}`;

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attendance.pdf"`);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);
      doc.fontSize(16).text(title, { align: 'center' }).moveDown(0.5);
      doc.fontSize(10).text(`Total booked: ${attendance.totalBooked}   Present: ${attendance.totalPresent}`, { align: 'center' }).moveDown(1);
      const cols = ['#', 'Name', 'Ticket Type', 'Qty', 'Payment', 'Transaction ID', 'Scanned At'];
      const widths = [25, 120, 90, 30, 70, 120, 90];
      let x = 40, y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      cols.forEach((c, i) => { doc.text(c, x, y, { width: widths[i], lineBreak: false }); x += widths[i]; });
      doc.moveDown(0.3).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.font('Helvetica').fontSize(8);
      rows.forEach((att, idx) => {
        if (doc.y > 750) { doc.addPage(); }
        x = 40; y = doc.y + 4;
        const vals = [
          idx + 1,
          att.userName || att.userId,
          att.ticketType || '-',
          att.quantity,
          att.paymentMethod || '-',
          att.transactionId || att.bookingId,
          att.scannedAt ? new Date(att.scannedAt).toLocaleString() : '-',
        ];
        vals.forEach((v, i) => { doc.text(String(v), x, y, { width: widths[i], lineBreak: false }); x += widths[i]; });
        doc.moveDown(0.3);
      });
      doc.end();
    } else {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Attendance');
      ws.mergeCells('A1:G1');
      ws.getCell('A1').value = title;
      ws.getCell('A1').font = { bold: true, size: 14 };
      ws.getCell('A1').alignment = { horizontal: 'center' };
      ws.addRow([`Total Booked: ${attendance.totalBooked}`, '', `Present: ${attendance.totalPresent}`]);
      ws.addRow([]);
      const header = ws.addRow(['#', 'Name', 'Email', 'Phone', 'Ticket Type', 'Qty', 'Payment Method', 'Transaction ID', 'Scanned At']);
      header.font = { bold: true };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8FF' } };
      ws.columns = [
        { key: 'no',   width: 5  },
        { key: 'name', width: 22 },
        { key: 'email',width: 28 },
        { key: 'phone',width: 16 },
        { key: 'type', width: 18 },
        { key: 'qty',  width: 6  },
        { key: 'pay',  width: 18 },
        { key: 'txn',  width: 24 },
        { key: 'time', width: 22 },
      ];
      rows.forEach((att, idx) => {
        ws.addRow([
          idx + 1,
          att.userName || att.userId,
          att.userEmail || '-',
          att.userPhone || '-',
          att.ticketType || '-',
          att.quantity,
          att.paymentMethod || '-',
          att.transactionId || att.bookingId,
          att.scannedAt ? new Date(att.scannedAt).toLocaleString() : '-',
        ]);
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="attendance.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
