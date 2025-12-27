import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const PYTHON_SERVICE_URL = process.env.SEAT_DETECTOR_URL || 'http://localhost:8001';

export const generateSeatingLayoutFromFile = async (filePath, totalCapacity, mimeType) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    console.log(`🚀 Generating seating layout for ${totalCapacity} seats...`);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/detect-seats`,
      formData,
      {
        headers: formData.getHeaders(),
        params: { expected_capacity: totalCapacity },
        timeout: 180000, // Increased to 3 minutes
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Seat detection failed');
    }
    
    const { seats, originalWidth, originalHeight, seatMask, layoutType, detectionMethod } = response.data;
    
    console.log(`✅ Python service returned ${seats.length} seats (Method: ${detectionMethod})`);
    
    // Sort seats by position
    const sortedSeats = seats.sort((a, b) => {
      const yDiff = a.centroid.y - b.centroid.y;
      if (Math.abs(yDiff) > originalHeight * 0.05) return yDiff;
      return a.centroid.x - b.centroid.x;
    });
    
    const rowLabels = assignRowLabels(sortedSeats, originalHeight);
    
    const formattedSeats = sortedSeats.map((seat, index) => ({
      seatId: seat.id || seat.seatId || `S${index + 1}`,
      row: rowLabels[index]?.row || seat.row || 'A',
      column: rowLabels[index]?.column || seat.column || (index + 1),
      x: seat.centroid.x,
      y: seat.centroid.y,
      contour: seat.contour,
      bbox: seat.bbox,
      confidence: seat.confidence || 0.8,
      isAvailable: true,
      isSelected: false,
      ticketTypeId: null,
      ticketTypeName: null,
      ticketTypeColor: null,
      price: 0
    }));
    
    const isGridGenerated = layoutType === 'grid' || detectionMethod === 'grid_fallback';
    
    return {
      seats: formattedSeats,
      rows: [...new Set(formattedSeats.map(s => s.row))],
      columns: Math.max(...formattedSeats.map(s => s.column)),
      totalSeats: formattedSeats.length,
      layoutType: isGridGenerated ? 'grid-generated' : 'image-derived',
      layoutWidth: originalWidth,
      layoutHeight: originalHeight,
      layoutStyle: isGridGenerated ? 'grid' : 'spatial',
      hasSpatialData: true,
      detectionMethod: detectionMethod,
      seatMask: seatMask,
      detectionAccuracy: totalCapacity ? ((formattedSeats.length / totalCapacity) * 100).toFixed(1) : 100,
      detectedCount: formattedSeats.length,
      expectedCount: totalCapacity || null,
      gridDimensions: isGridGenerated ? {
        rows: [...new Set(formattedSeats.map(s => s.row))].length,
        cols: Math.max(...formattedSeats.map(s => s.column))
      } : undefined,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Seating layout generation error:', error.message);
    throw error;
  }
};

function assignRowLabels(seats, imageHeight) {
  if (!seats || seats.length === 0) {
    return [];
  }
  
  const rowTolerance = imageHeight * 0.06;
  const rows = [];
  let currentRow = [seats[0]];
  
  for (let i = 1; i < seats.length; i++) {
    const seat = seats[i];
    const avgY = currentRow.reduce((sum, s) => sum + s.centroid.y, 0) / currentRow.length;
    
    if (Math.abs(seat.centroid.y - avgY) < rowTolerance) {
      currentRow.push(seat);
    } else {
      rows.push([...currentRow]);
      currentRow = [seat];
    }
  }
  rows.push(currentRow);
  
  const labels = [];
  rows.forEach((row, rowIdx) => {
    const rowLabel = String.fromCharCode(65 + rowIdx);
    row.forEach((seat, colIdx) => {
      const seatIdx = seats.findIndex(s => 
        s.centroid && seat.centroid && 
        s.centroid.x === seat.centroid.x && 
        s.centroid.y === seat.centroid.y
      );
      if (seatIdx !== -1) {
        labels[seatIdx] = {
          row: rowLabel,
          column: colIdx + 1
        };
      }
    });
  });
  
  return labels;
}

export const validateSeatingLayout = (layout) => {
  if (!layout || !layout.seats || !Array.isArray(layout.seats)) {
    return { valid: false, error: 'Invalid layout structure' };
  }

  const requiredFields = [
    'seatId', 'row', 'column', 'isAvailable', 'isSelected',
    'ticketTypeId', 'ticketTypeName', 'ticketTypeColor', 'price'
  ];

  for (const seat of layout.seats) {
    for (const field of requiredFields) {
      if (!(field in seat)) {
        return {
          valid: false,
          error: `Seat ${seat.seatId || 'unknown'} missing field: ${field}`
        };
      }
    }
  }

  return { valid: true };
};

export const normalizeSeatData = (seat) => ({
  seatId: String(seat.seatId || ''),
  row: String(seat.row || ''),
  column: Number(seat.column || 0),
  x: Number(seat.x || 0),
  y: Number(seat.y || 0),
  isAvailable: seat.isAvailable !== false,
  isSelected: false,
  ticketTypeId: seat.ticketTypeId !== undefined && seat.ticketTypeId !== null 
    ? String(seat.ticketTypeId) 
    : null,
  ticketTypeName: seat.ticketTypeName !== undefined && seat.ticketTypeName !== null 
    ? String(seat.ticketTypeName) 
    : null,
  ticketTypeColor: seat.ticketTypeColor !== undefined && seat.ticketTypeColor !== null 
    ? String(seat.ticketTypeColor) 
    : null,
  price: seat.price !== undefined && seat.price !== null 
    ? Number(seat.price) 
    : 0
});

export const generateFallbackLayout = (totalCapacity) => {
  throw new Error('Fallback disabled - use Python service for exact layouts');
};
