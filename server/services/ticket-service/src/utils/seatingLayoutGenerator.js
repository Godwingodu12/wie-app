
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

const PYTHON_SERVICE_URL = process.env.SEAT_DETECTOR_URL || 'http://localhost:8001';

export const generateSeatingLayoutFromFile = async (
  filePath,
  totalCapacity,
  mimeType,
  venueType = null
) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Layout file not found at path: ${filePath}`);
  }
  const fileSize = fs.statSync(filePath).size;

  await checkServiceHealth();

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const params = { expected_capacity: totalCapacity };
  if (venueType) params.venue_type = venueType;

  let response;
  try {
    response = await axios.post(
      `${PYTHON_SERVICE_URL}/detect-seats`,
      formData,
      {
        headers: formData.getHeaders(),
        params,
        timeout: 240_000,          
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
  } catch (axiosError) {
    handleAxiosError(axiosError);
  }

  const data = response.data;

  if (!data.success) {
    throw new Error(data.error || 'Seat detection service returned failure');
  }

  const { seats, originalWidth, originalHeight, seatMask, detectionMethod,
          detectionTier, venueType: detectedVenue, stagePosition, sections } = data;

  // Sort seats spatially (top-left → bottom-right)
  const sortedSeats = sortSeatsSpatially(seats, originalHeight);

  // Re-assign clean row labels after sorting
  const labelledSeats = relabelSeats(sortedSeats, originalHeight);

  // Build final structured layout
  const formattedSeats = labelledSeats.map((seat, index) => normalizeSeatData({
    ...seat,
    seatId: seat.seatId || `${seat.row}${seat.column}`,
    row:    seat.row    || 'A',
    column: seat.column || (index + 1),
    x:      seat.centroid?.x || 0,
    y:      seat.centroid?.y || 0,
    category: seat.category || 'general',
    section:  seat.section  || 'Main',
    confidence: seat.confidence || 0.8,
    isAvailable: true,
    isSelected: false,
    ticketTypeId: null,
    ticketTypeName: null,
    ticketTypeColor: null,
    price: 0,
    curved: seat.curved || false,
  }));

  const uniqueRows    = [...new Set(formattedSeats.map(s => s.row))];
  const maxColumn     = Math.max(...formattedSeats.map(s => s.column), 0);
  const isGrid        = ['grid-generated', 'smart_grid'].includes(detectionTier);

  const layout = {
    seats:           formattedSeats,
    rows:            uniqueRows,
    columns:         maxColumn,
    totalSeats:      formattedSeats.length,
    layoutType:      isGrid ? 'grid-generated' : 'image-derived',
    layoutStyle:     isGrid ? 'grid' : 'spatial',
    hasSpatialData:  true,
    detectionMethod: detectionMethod || detectionTier,
    detectionTier:   detectionTier,
    venueType:       detectedVenue || venueType || 'general',
    stagePosition:   stagePosition || 'top',
    sections:        sections || [],
    layoutWidth:     originalWidth,
    layoutHeight:    originalHeight,
    seatMask:        seatMask,
    detectedCount:   formattedSeats.length,
    expectedCount:   totalCapacity || null,
    detectionAccuracy: totalCapacity
      ? ((formattedSeats.length / totalCapacity) * 100).toFixed(1)
      : '100.0',
    gridDimensions: isGrid ? {
      rows: uniqueRows.length,
      cols: maxColumn,
    } : undefined,
    timestamp: new Date().toISOString(),
  };

  return layout;
};

async function checkServiceHealth() {
  try {
    const res = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 5000 });
  } catch {
    throw Object.assign(
      new Error(
        'Cannot connect to seat detection service. ' +
        'Make sure it is running:\n' +
        '  cd server/services/seat-detector\n' +
        '  venv\\Scripts\\activate   (Windows) OR  source venv/bin/activate\n' +
        '  python app.py'
      ),
      { code: 'ECONNREFUSED' }
    );
  }
}

function handleAxiosError(err) {
  if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
    throw Object.assign(
      new Error('Seat detection service is not running on port 8001'),
      { code: 'ECONNREFUSED' }
    );
  }
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    throw Object.assign(
      new Error(
        'Seat detection timed out. Try:\n' +
        '• Resize the image to max 2000x2000px\n' +
        '• Compress the image before uploading\n' +
        '• Use PNG format for best results'
      ),
      { code: 'ECONNABORTED' }
    );
  }
  throw err;
}


/**
 * Sort seats spatially: top-to-bottom, left-to-right within each row band.
 */
function sortSeatsSpatially(seats, imageHeight) {
  if (!seats?.length) return [];
  const tolerance = (imageHeight || 1000) * 0.05;
  return [...seats].sort((a, b) => {
    const ay = a.centroid?.y ?? a.y ?? 0;
    const by = b.centroid?.y ?? b.y ?? 0;
    const ax = a.centroid?.x ?? a.x ?? 0;
    const bx = b.centroid?.x ?? b.x ?? 0;
    if (Math.abs(ay - by) > tolerance) return ay - by;
    return ax - bx;
  });
}


/**
 * Re-assign row labels (A, B, C...) and column numbers based on
 * spatial position, preserving any section/category info from the service.
 */
function relabelSeats(seats, imageHeight) {
  if (!seats?.length) return [];
  const tolerance = (imageHeight || 1000) * 0.055;

  const rowBuckets = [];
  let currentBucket = [seats[0]];

  for (let i = 1; i < seats.length; i++) {
    const seat = seats[i];
    const avgY = currentBucket.reduce((s, b) => s + (b.centroid?.y ?? 0), 0) / currentBucket.length;
    if (Math.abs((seat.centroid?.y ?? 0) - avgY) < tolerance) {
      currentBucket.push(seat);
    } else {
      rowBuckets.push(currentBucket.sort((a, b) => (a.centroid?.x ?? 0) - (b.centroid?.x ?? 0)));
      currentBucket = [seat];
    }
  }
  rowBuckets.push(currentBucket.sort((a, b) => (a.centroid?.x ?? 0) - (b.centroid?.x ?? 0)));

  const labelled = [];
  rowBuckets.forEach((bucket, rowIdx) => {
    const rowLabel = rowIdx < 26 ? String.fromCharCode(65 + rowIdx) : `R${rowIdx + 1}`;
    bucket.forEach((seat, colIdx) => {
      labelled.push({
        ...seat,
        row:    rowLabel,
        column: colIdx + 1,
        seatId: `${rowLabel}${colIdx + 1}`,
      });
    });
  });

  return labelled;
}

export const normalizeSeatData = (seat) => ({
  seatId:          String(seat.seatId || ''),
  row:             String(seat.row    || ''),
  column:          Number(seat.column || 0),
  x:               Number(seat.x      || seat.centroid?.x || 0),
  y:               Number(seat.y      || seat.centroid?.y || 0),
  section:         String(seat.section  || 'Main'),
  category:        String(seat.category || 'general'),
  confidence:      Number(seat.confidence ?? 0.8),
  isAvailable:     seat.isAvailable !== false,
  isSelected:      false,
  ticketTypeId:    seat.ticketTypeId   != null ? String(seat.ticketTypeId)   : null,
  ticketTypeName:  seat.ticketTypeName != null ? String(seat.ticketTypeName) : null,
  ticketTypeColor: seat.ticketTypeColor!= null ? String(seat.ticketTypeColor): null,
  price:           seat.price != null ? Number(seat.price) : 0,
  curved:          Boolean(seat.curved ?? false),
  bbox:            seat.bbox || null,
  centroid:        seat.centroid || { x: Number(seat.x || 0), y: Number(seat.y || 0) },
});

export const validateSeatingLayout = (layout) => {
  if (!layout || !layout.seats || !Array.isArray(layout.seats)) {
    return { valid: false, error: 'Invalid layout — missing seats array' };
  }
  if (!layout.rows || !Array.isArray(layout.rows)) {
    return { valid: false, error: 'Invalid layout — missing rows array' };
  }

  const required = ['seatId', 'row', 'column', 'isAvailable', 'isSelected',
                    'ticketTypeId', 'ticketTypeName', 'ticketTypeColor', 'price'];

  for (const seat of layout.seats) {
    for (const field of required) {
      if (!(field in seat)) {
        return {
          valid: false,
          error: `Seat ${seat.seatId || 'unknown'} is missing required field: ${field}`,
        };
      }
    }
  }

  return { valid: true };
};

export const generateFallbackLayout = (_totalCapacity) => {
  throw new Error(
    'generateFallbackLayout is disabled — the Python service handles all fallbacks internally. ' +
    'Ensure seat-detector/app.py is running.'
  );
};
