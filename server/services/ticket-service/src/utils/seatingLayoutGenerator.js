import { Jimp } from "jimp";
import mammoth from "mammoth";
import fs from "fs";
import { createRequire } from "module";
import Tesseract from 'tesseract.js';
const fsSync = fs; 
import sharp from 'sharp';
import path from 'path';
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const createSeatObject = (seatId, row, column) => ({
  seatId: String(seatId),
  row: String(row),
  column: Number(column),
  isAvailable: true,
  isSelected: false,
  ticketTypeId: null,
  ticketTypeName: null,
  ticketTypeColor: null,
  price: 0
});
export const generateFallbackLayout = (totalCapacity) => {
  console.log('🔧 Generating fallback grid layout for capacity:', totalCapacity);
  const seatsPerRow = 10;
  const numRows = Math.ceil(totalCapacity / seatsPerRow);
  const rows = [];
  const seats = [];

  for (let r = 0; r < numRows; r++) {
    const rowLabel = String.fromCharCode(65 + r); 
    rows.push(rowLabel);

    const seatsInThisRow = Math.min(seatsPerRow, totalCapacity - (r * seatsPerRow));
    
    for (let c = 1; c <= seatsInThisRow; c++) {
      seats.push(createSeatObject(`${rowLabel}${c}`, rowLabel, c));
    }
  }
  return {
    rows,
    columns: seatsPerRow,
    seats,
    layoutStyle: 'grid',
    ticketTypeAssignments: []
  };
};
export const generateSeatingLayoutFromFile = async (filePath, totalCapacity, mimeType) => {
  console.log('🎨 Starting seating layout generation:', {
    filePath,
    totalCapacity,
    mimeType
  });

  try {
    // Validate inputs
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File path does not exist');
    }

    if (!totalCapacity || totalCapacity <= 0) {
      throw new Error('Invalid total capacity');
    }

    let detectedText = '';
    let layoutStyle = 'grid';

    // Process based on file type
    if (mimeType.startsWith('image/')) {
      console.log('📸 Processing image file for OCR...');
      
      // Enhance image for better OCR
      const enhancedImagePath = path.join(
        path.dirname(filePath),
        `enhanced_${path.basename(filePath)}`
      );

      await sharp(filePath)
        .greyscale()
        .normalize()
        .sharpen()
        .toFile(enhancedImagePath);

      // Perform OCR
      const { data: { text } } = await Tesseract.recognize(
        enhancedImagePath,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      detectedText = text;
      
      // Cleanup enhanced image
      try {
        fs.unlinkSync(enhancedImagePath);
      } catch (err) {
        console.warn('Could not delete enhanced image:', err);
      }

      console.log('✅ OCR completed. Detected text length:', detectedText.length);
      
    } else if (mimeType === 'application/pdf') {
      console.log('📄 PDF processing not fully implemented, using fallback');
      detectedText = '';
    }

    // Parse detected text to extract seat information
    const seatPattern = /([A-Z])[-\s]?(\d+)/gi;
    const matches = [...detectedText.matchAll(seatPattern)];
    
    console.log(`🔍 Found ${matches.length} potential seat matches in OCR`);

    let rows = [];
    let seats = [];

    if (matches.length >= totalCapacity * 0.3) {
      // Use detected seats
      console.log('✅ Using OCR-detected seat layout');
      
      const seatMap = new Map();
      matches.forEach(match => {
        const row = match[1].toUpperCase();
        const col = parseInt(match[2], 10);
        if (!isNaN(col)) {
          const seatId = `${row}${col}`;
          if (!seatMap.has(seatId)) {
            seatMap.set(seatId, { row, column: col });
          }
        }
      });

      // Convert to array and sort
      const detectedSeats = Array.from(seatMap.values());
      detectedSeats.sort((a, b) => {
        if (a.row !== b.row) return a.row.localeCompare(b.row);
        return a.column - b.column;
      });

      // Create unique rows
      rows = [...new Set(detectedSeats.map(s => s.row))];
      
      // ✅ CRITICAL FIX: Create seats with ALL 4 required fields initialized
      seats = detectedSeats.map(s => 
        createSeatObject(`${s.row}${s.column}`, s.row, s.column)
      );

      // Adjust to match capacity
      if (seats.length < totalCapacity) {
        seats = seats.concat(
          generateFallbackSeats(totalCapacity - seats.length, rows[rows.length - 1])
        );
      } else if (seats.length > totalCapacity) {
        seats = seats.slice(0, totalCapacity);
      }

      layoutStyle = 'image_detected';
    } else {
      // Fallback to grid layout
      console.log('⚠️ OCR detection insufficient, using grid fallback');
      const fallbackLayout = generateFallbackLayout(totalCapacity);
      rows = fallbackLayout.rows;
      seats = fallbackLayout.seats;
      layoutStyle = 'grid';
    }

    const columns = Math.max(...seats.map(s => s.column), 1);

    console.log('✅ Layout generation complete:', {
      totalSeats: seats.length,
      rows: rows.length,
      columns,
      layoutStyle
    });

    // ✅ FINAL VALIDATION: Ensure all seats have required fields
    const validatedSeats = seats.map(seat => ({
      ...seat,
      ticketTypeId: seat.ticketTypeId ?? null,
      ticketTypeName: seat.ticketTypeName ?? null,
      ticketTypeColor: seat.ticketTypeColor ?? null,
      price: seat.price ?? 0
    }));

    return {
      rows,
      columns,
      seats: validatedSeats,
      layoutStyle,
      ticketTypeAssignments: [] // Empty initially - assignments happen in modal
    };

  } catch (error) {
    console.error('❌ Error in generateSeatingLayoutFromFile:', error);
    throw error;
  }
};
const generateFallbackSeats = (count, startRow = 'A') => {
  const seats = [];
  let currentRow = startRow.charCodeAt(0);
  let column = 1;
  const seatsPerRow = 10;

  for (let i = 0; i < count; i++) {
    if (column > seatsPerRow) {
      currentRow++;
      column = 1;
    }
    const row = String.fromCharCode(currentRow);
    // ✅ Use helper function to ensure consistency
    seats.push(createSeatObject(`${row}${column}`, row, column));
    column++;
  }

  return seats;
};

const extractSeatsFromImageVisual = async (imagePath, totalCapacity) => {
  const image = await Jimp.read(imagePath);
  const { width, height } = image.bitmap;

  // Preprocess image to enhance seat detection
  const processed = await preprocessImageForSeatDetection(image);
  
  // Detect seat blobs/shapes from the image
  const detectedSeats = await detectSeatShapes(processed, totalCapacity);

  if (detectedSeats.length === 0) {
    throw new Error("No seats detected in the layout image. Ensure seats are visible as distinct shapes (circles, rectangles, squares, or chair symbols).");
  }

  // Sort seats by position (top-to-bottom, left-to-right)
  detectedSeats.sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > 30) return yDiff;
    return a.x - b.x;
  });

  // STRICT CAPACITY ENFORCEMENT - Step 1: Trim before generating additional
  let finalSeats = detectedSeats.slice(0, totalCapacity);
  
  // If detected seats are less than capacity, generate additional seats
  if (finalSeats.length < totalCapacity) {
    const additional = generateAdditionalSeatsVisual(finalSeats, totalCapacity, width, height);
    finalSeats = [...finalSeats, ...additional];
  }
  finalSeats = finalSeats.slice(0, totalCapacity);
  // Assign seat IDs based on position
  const seatsWithIds = assignSeatIds(finalSeats);
  seatsWithIds.forEach(seat => {
    if (seat.ticketTypeId === undefined) seat.ticketTypeId = null;
    if (seat.ticketTypeName === undefined) seat.ticketTypeName = null;
    if (seat.ticketTypeColor === undefined) seat.ticketTypeColor = null;
    if (seat.price === undefined) seat.price = 0;
  });
  // STRICT CAPACITY ENFORCEMENT - Step 3: Absolute final enforcement
  const strictlyEnforcedSeats = seatsWithIds.slice(0, totalCapacity);

  // Extract row labels and calculate columns
  const rowLabels = [...new Set(strictlyEnforcedSeats.map(s => s.row))].sort();
  const maxColumns = Math.max(...strictlyEnforcedSeats.map(s => s.column));

  return {
    seats: strictlyEnforcedSeats,
    rows: rowLabels,
    columns: maxColumns,
    totalSeats: strictlyEnforcedSeats.length,
    layoutWidth: width,
    layoutHeight: height,
    layoutStyle: "exact_visual_extraction",
    detectionMethod: "shape_based_detection",
  };
};
const preprocessImageForSeatDetection = async (image) => {
  const processed = image.clone();
  // Convert to grayscale
  processed.greyscale();
  // Enhance contrast
  processed.contrast(0.3);
  processed.normalize();
  // Apply edge detection to highlight seat boundaries
  processed.convolute([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ]);
  return processed;
};
const detectSeatShapes = async (image, targetCapacity) => {
  const { width, height, data } = image.bitmap;
  const seats = [];
  // Create a binary threshold image
  const threshold = 128;
  const visited = new Set();
  // Blob detection parameters - MORE PERMISSIVE
  const minBlobSize = 15; // Reduced from 20
  const maxBlobSize = 8000; // Increased from 5000
  // Find blobs (connected components)
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const pixelKey = `${x},${y}`;
      
      if (visited.has(pixelKey)) continue;
      
      // Check if pixel is dark enough (potential seat)
      if (data[idx] < threshold) {
        // Flood fill to find blob extent
        const blob = floodFill(data, width, height, x, y, threshold, visited);
        
        if (blob.size >= minBlobSize && blob.size <= maxBlobSize) {
          // Calculate blob center and bounds
          const centerX = Math.round(blob.sumX / blob.count);
          const centerY = Math.round(blob.sumY / blob.count);
          const blobWidth = blob.maxX - blob.minX;
          const blobHeight = blob.maxY - blob.minY;
          
          // Add as detected seat
          seats.push({
            x: centerX,
            y: centerY,
            width: blobWidth,
            height: blobHeight,
            confidence: Math.min(blob.size / 100, 1.0),
          });
        }
      }
    }
  }
  // Filter and refine seats
  let refinedSeats = filterAndRefineSeats(seats, targetCapacity);
  // If we didn't get enough seats, try alternative method
  if (refinedSeats.length < targetCapacity * 0.3) {
    refinedSeats = await detectSeatsAlternativeMethod(image, targetCapacity);
  }
  return refinedSeats;
};
const floodFill = (data, width, height, startX, startY, threshold, visited) => {
  const stack = [[startX, startY]];
  const blob = {
    size: 0,
    count: 0,
    sumX: 0,
    sumY: 0,
    minX: startX,
    maxX: startX,
    minY: startY,
    maxY: startY,
  };
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const pixelKey = `${x},${y}`;
    if (visited.has(pixelKey)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const idx = (y * width + x) * 4;
    if (data[idx] >= threshold) continue;

    visited.add(pixelKey);
    blob.size++;
    blob.count++;
    blob.sumX += x;
    blob.sumY += y;
    blob.minX = Math.min(blob.minX, x);
    blob.maxX = Math.max(blob.maxX, x);
    blob.minY = Math.min(blob.minY, y);
    blob.maxY = Math.max(blob.maxY, y);

    // Add neighbors
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return blob;
};
const filterAndRefineSeats = (seats, targetCapacity) => {
  if (seats.length === 0) return [];
  // Remove seats that are too close to each other (duplicates)
  const minDistance = 15; // Reduced from 20 for better detection
  const filtered = [];
  for (const seat of seats) {
    const tooClose = filtered.some(existing => {
      const distance = Math.sqrt(
        Math.pow(seat.x - existing.x, 2) + Math.pow(seat.y - existing.y, 2)
      );
      return distance < minDistance;
    });

    if (!tooClose) {
      filtered.push(seat);
    }
  }
  if (filtered.length > targetCapacity * 1.5) {
    filtered.sort((a, b) => b.confidence - a.confidence);
    return filtered.slice(0, Math.ceil(targetCapacity * 1.2));
  }
  return filtered;
};
const detectSeatsAlternativeMethod = async (image, targetCapacity) => {
  const { width, height, data } = image.bitmap;
  const seats = [];

  // Estimate grid dimensions based on capacity and image size
  const aspectRatio = width / height;
  const estimatedRows = Math.round(Math.sqrt(targetCapacity / aspectRatio));
  const estimatedCols = Math.ceil(targetCapacity / estimatedRows);

  // Sample grid to find dark regions (seats)
  const cellWidth = width / estimatedCols;
  const cellHeight = height / estimatedRows;
  const threshold = 150;

  for (let row = 0; row < estimatedRows; row++) {
    for (let col = 0; col < estimatedCols; col++) {
      // Stop if we've reached target capacity
      if (seats.length >= targetCapacity) break;
      
      const centerX = Math.round(col * cellWidth + cellWidth / 2);
      const centerY = Math.round(row * cellHeight + cellHeight / 2);

      // Sample 5x5 region around center
      let darkPixels = 0;
      const sampleSize = 5;

      for (let dy = -sampleSize; dy <= sampleSize; dy++) {
        for (let dx = -sampleSize; dx <= sampleSize; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;

          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = (y * width + x) * 4;
            if (data[idx] < threshold) darkPixels++;
          }
        }
      }

      // If enough dark pixels, consider it a seat
      if (darkPixels > sampleSize * sampleSize * 0.3) {
        seats.push({
          x: centerX,
          y: centerY,
          width: cellWidth * 0.8,
          height: cellHeight * 0.8,
          confidence: darkPixels / (sampleSize * sampleSize * 4),
        });
      }
    }
    if (seats.length >= targetCapacity) break;
  }
  return seats.slice(0, targetCapacity);
};
const assignSeatIds = (seats) => {
  if (seats.length === 0) return [];
  const rowTolerance = 30;  
  const rows = [];
  for (const seat of seats) {
    let foundRow = false;
    for (const row of rows) {
      const avgY = row.reduce((sum, s) => sum + s.y, 0) / row.length;
      if (Math.abs(seat.y - avgY) < rowTolerance) {
        row.push(seat);
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rows.push([seat]);
    }
  }

  // Sort rows by Y coordinate
  rows.sort((a, b) => {
    const avgYA = a.reduce((sum, s) => sum + s.y, 0) / a.length;
    const avgYB = b.reduce((sum, s) => sum + s.y, 0) / b.length;
    return avgYA - avgYB;
  });

  // Sort seats within each row by X coordinate
  rows.forEach(row => row.sort((a, b) => a.x - b.x));

  // Assign row letters and column numbers
  const result = [];
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  rows.forEach((row, rowIndex) => {
    const rowLabel = rowIndex < 26 
      ? rowLabels[rowIndex] 
      : rowLabels[Math.floor(rowIndex / 26) - 1] + rowLabels[rowIndex % 26];

    row.forEach((seat, colIndex) => {
      result.push({
        seatId: `${rowLabel}${colIndex + 1}`,
        row: rowLabel,
        column: colIndex + 1,
        x: seat.x,
        y: seat.y,
        width: seat.width,
        height: seat.height,
        confidence: seat.confidence,
        isAvailable: true,
        isSelected: false,
        ticketTypeId: null,
        ticketTypeName: null,
        ticketTypeColor: null,
        price: 0,
      });
    });
  });

  return result;
};
const generateAdditionalSeatsVisual = (existingSeats, targetCapacity, layoutWidth, layoutHeight) => {
  const needed = targetCapacity - existingSeats.length;
  
  // Safety check - never generate if we already have enough or more
  if (needed <= 0) return [];

  const additional = [];
  
  // Calculate average seat dimensions from existing seats
  const avgWidth = existingSeats.reduce((sum, s) => sum + (s.width || 30), 0) / existingSeats.length;
  const avgHeight = existingSeats.reduce((sum, s) => sum + (s.height || 30), 0) / existingSeats.length;
  
  // Find the last row of seats
  const maxY = Math.max(...existingSeats.map(s => s.y));
  const lastRowSeats = existingSeats.filter(s => Math.abs(s.y - maxY) < 30);
  
  // Calculate spacing between seats
  if (lastRowSeats.length > 1) {
    lastRowSeats.sort((a, b) => a.x - b.x);
    const avgSpacing = (lastRowSeats[lastRowSeats.length - 1].x - lastRowSeats[0].x) / (lastRowSeats.length - 1);
    
    // Determine seats per row based on layout width and spacing
    const seatsPerRow = Math.floor(layoutWidth / (avgWidth + avgSpacing)) || 10;
    const rowSpacing = avgHeight + 20; // Spacing between rows
    
    let currentX = lastRowSeats[lastRowSeats.length - 1].x + avgSpacing;
    let currentY = maxY;
    let seatsInCurrentRow = lastRowSeats.length;
    
    // STRICT LOOP - only generate exactly what's needed
    for (let i = 0; i < needed && additional.length < needed; i++) {
      // Move to next row if current row is full
      if (seatsInCurrentRow >= seatsPerRow) {
        currentY += rowSpacing;
        currentX = lastRowSeats[0].x; // Start from left side
        seatsInCurrentRow = 0;
      }
      additional.push({
        x: currentX,
        y: currentY,
        width: avgWidth,
        height: avgHeight,
        confidence: 0.8,
        ticketTypeId: null,
        ticketTypeName: null,
        ticketTypeColor: null,
        price: 0
      });
      
      currentX += avgSpacing;
      seatsInCurrentRow++;
    }
  } else {
    // Fallback: simple grid pattern
    const seatsPerRow = Math.ceil(Math.sqrt(needed));
    const spacing = Math.min(layoutWidth / (seatsPerRow + 1), 50);
    
    // STRICT LOOP - only generate exactly what's needed
    for (let i = 0; i < needed && additional.length < needed; i++) {
      const row = Math.floor(i / seatsPerRow);
      const col = i % seatsPerRow;
      additional.push({
        x: spacing + col * spacing,
        y: maxY + 50 + row * spacing,
        width: avgWidth,
        height: avgHeight,
        confidence: 0.7,
        ticketTypeId: null,
        ticketTypeName: null,
        ticketTypeColor: null,
        price: 0
      });
    }
  }
  
  // FINAL SAFETY - ensure we never return more than needed
  return additional.slice(0, needed);
};
const extractSeatsFromPDFVisual = async (pdfPath, totalCapacity) => {
  // For PDF visual extraction, you'd need to convert PDF to image first
  // This requires additional libraries like pdf-poppler or pdf2pic
  // For now, fallback to text extraction
  throw new Error("PDF visual extraction not implemented");
};

/**
 * EXTRACT LAYOUT FROM PDF (Text method - fallback)
 */
const extractLayoutFromPDF = async (pdfPath, totalCapacity) => {
  const buffer = await fs.promises.readFile(pdfPath);
  const pdfData = await pdfParse(buffer);
  
  // Try to find seat patterns in text
  const seatPattern = /([A-Z]{1,2})[\s-]?(\d{1,3})/g;
  const seats = [];
  const seenSeats = new Set();

  let match;
  while ((match = seatPattern.exec(pdfData.text)) !== null) {
    const row = match[1];
    const column = parseInt(match[2]);
    const seatId = `${row}${column}`;

    if (!seenSeats.has(seatId) && column > 0 && column < 200) {
      seenSeats.add(seatId);
      seats.push({
        seatId, 
        row, 
        column,
        x: null, 
        y: null, 
        width: null, 
        height: null,
        isAvailable: true, 
        isSelected: false,
        ticketTypeId: null,      // ✅ Already present
        ticketTypeName: null,    // ✅ Already present
        ticketTypeColor: null,   // ✅ Already present
        price: 0,                // ✅ ADD THIS LINE
      });
    }
  }

  if (seats.length === 0) {
    throw new Error("Could not extract seating layout from PDF. Please use an image file with visible seat shapes.");
  }

  // Fill up to target capacity if needed
  if (seats.length < totalCapacity) {
    seats.push(...generateAdditionalSeats(seats, totalCapacity));
  }
  const rowLabels = [...new Set(seats.map(s => s.row))].sort();
  const maxColumns = Math.max(...seats.map(s => s.column));
  const finalSeats = seats.slice(0, totalCapacity);
  return {
    seats: finalSeats,
    rows: rowLabels,
    columns: maxColumns,
    totalSeats: finalSeats.length, 
    layoutWidth: null,
    layoutHeight: null,
    layoutStyle: "text_extraction",
    detectionMethod: "pdf_text_extraction",
  };
};

/**
 * EXTRACT LAYOUT FROM DOCUMENT (Word files)
 */
const extractLayoutFromDocument = async (docPath, totalCapacity) => {
  const buffer = await fs.promises.readFile(docPath);
  const result = await mammoth.extractRawText({ buffer });
  
  const seatPattern = /([A-Z]{1,2})[\s-]?(\d{1,3})/g;
  const seats = [];
  const seenSeats = new Set();

  let match;
  while ((match = seatPattern.exec(result.value)) !== null) {
    const row = match[1];
    const column = parseInt(match[2]);
    const seatId = `${row}${column}`;

    if (!seenSeats.has(seatId) && column > 0 && column < 200) {
        seenSeats.add(seatId);
        seats.push({
          seatId, 
          row, 
          column,
          x: null, 
          y: null, 
          width: null, 
          height: null,
          isAvailable: true, 
          isSelected: false,
          ticketTypeId: null,      // ✅ Already present
          ticketTypeName: null,    // ✅ Already present
          ticketTypeColor: null,   // ✅ Already present
          price: 0,                // ✅ ADD THIS LINE
        });
    }
  }

  if (seats.length === 0) {
    throw new Error("Could not extract seating layout from document. Please use an image file with visible seat shapes.");
  }

  // Fill up to target capacity if needed
  if (seats.length < totalCapacity) {
    seats.push(...generateAdditionalSeats(seats, totalCapacity));
  }
  const rowLabels = [...new Set(seats.map(s => s.row))].sort();
  const maxColumns = Math.max(...seats.map(s => s.column));
  // STRICT capacity enforcement
  const finalSeats = seats.slice(0, totalCapacity);
  return {
    seats: finalSeats,
    rows: rowLabels,
    columns: maxColumns,
    totalSeats: finalSeats.length, // Use finalSeats.length
    layoutWidth: null,
    layoutHeight: null,
    layoutStyle: "text_extraction",
    detectionMethod: "doc_text_extraction",
  };
};
const generateAdditionalSeats = (existingSeats, targetCapacity) => {
  const additional = [];
  const existingCount = existingSeats.length;
  const needed = targetCapacity - existingCount;

  if (needed <= 0) return additional;

  // Find the last row and column
  const lastSeat = existingSeats[existingSeats.length - 1];
  let currentRow = lastSeat.row;
  let currentCol = lastSeat.column;

  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const maxColsPerRow = 20;

  for (let i = 0; i < needed; i++) {
    currentCol++;
    
    if (currentCol > maxColsPerRow) {
      currentCol = 1;
      const rowIndex = rowLabels.indexOf(currentRow);
      currentRow = rowIndex < 25 
        ? rowLabels[rowIndex + 1]
        : rowLabels[Math.floor((rowIndex + 1) / 26) - 1] + rowLabels[(rowIndex + 1) % 26];
    }
    additional.push({
      seatId: `${currentRow}${currentCol}`,
      row: currentRow,
      column: currentCol,
      x: null,
      y: null,
      width: null,
      height: null,
      isAvailable: true,
      isSelected: false,
      ticketTypeId: null,     
      ticketTypeName: null,   
      ticketTypeColor: null,  
      price: 0,                
    });
  }
  return additional;
};
export const validateSeatingLayout = (layout) => {
  if (!layout || !layout.seats || !Array.isArray(layout.seats)) {
    return { valid: false, error: 'Invalid layout structure' };
  }

  const requiredFields = ['seatId', 'row', 'column', 'isAvailable', 'isSelected', 
                          'ticketTypeId', 'ticketTypeName', 'ticketTypeColor', 'price'];

  for (const seat of layout.seats) {
    for (const field of requiredFields) {
      if (!(field in seat)) {
        return { 
          valid: false, 
          error: `Seat ${seat.seatId || 'unknown'} missing required field: ${field}` 
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
export default {
  generateSeatingLayoutFromFile,
  validateSeatingLayout,
  generateFallbackLayout,
};