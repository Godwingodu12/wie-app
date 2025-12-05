import React, { useState, useEffect } from 'react';
const SeatAssignmentModal = ({
  isOpen,
  onClose,
  onSave,
  seatingLayout,
  ticketTypes = [],
  existingAssignments = {},
  ticketTypeColors = [],
  darkMode,
  getTicketTypeColor // optional
}) => {
  const [assignments, setAssignments] = useState({});
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [selectionMode, setSelectionMode] = useState('range');
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  useEffect(() => {
    if (isOpen) {
      // Deep clone to avoid mutation of prop object
      setAssignments(JSON.parse(JSON.stringify(existingAssignments || {})));
      setSelectedSeats(new Set());
      setRangeStart(null);
      setRangeEnd(null);
      setSelectedRow(null);
      setErrors({});
    }
  }, [isOpen, JSON.stringify(existingAssignments || {})]);

  if (!isOpen) return null;

  // Helper: deterministic color getter (prefers provided getTicketTypeColor prop)
  const getTicketTypeColorLocal = (typeId) => {
    if (!typeId) return null;
    if (typeof getTicketTypeColor === 'function') return getTicketTypeColor(typeId);
    const idx = ticketTypes.findIndex(t => t.id === typeId);
    if (idx === -1) {
      // fallback: if direct mapping by id in ticketTypeColors isn't possible, use hash-style fallback
      return ticketTypeColors.length ? ticketTypeColors[Math.abs(hashString(typeId)) % ticketTypeColors.length] : '#6B7280';
    }
    return ticketTypeColors.length ? ticketTypeColors[idx % ticketTypeColors.length] : (ticketTypes[idx].color || '#6B7280');
  };

  // small hash for fallback indexing
  const hashString = (s = '') => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
    return Math.abs(h);
  };

  // Convert hex (#RRGGBB or #RGB) to rgba string
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(107,114,128,${alpha})`; // default gray
    const h = hex.replace('#', '');
    let r, g, b;
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // SOURCE-OF-TRUTH: get assigned ticket type id for a seat from `assignments`
  const getAssignedTypeIdForSeat = (seatId) => {
    const found = Object.entries(assignments || {}).find(([typeId, seatIds]) =>
      Array.isArray(seatIds) && seatIds.includes(seatId)
    );
    return found ? found[0] : null;
  };

  const getAssignedCount = (ticketTypeId) => {
    return assignments[ticketTypeId]?.length || 0;
  };

  const getRemainingCapacity = (ticketTypeId) => {
    const ticket = ticketTypes.find(t => t.id === ticketTypeId);
    return ticket ? (ticket.capacity - getAssignedCount(ticketTypeId)) : 0;
  };

  const getTotalAssigned = () => {
    return Object.values(assignments).flat().length;
  };

  const getUnassignedSeats = () => {
    const assignedSet = new Set(Object.values(assignments).flat());
    return seatingLayout.seats.filter(s => !assignedSet.has(s.seatId));
  };

  // Row click handler (works for checkbox / single / range flows)
  const handleRowClick = (rowLabel) => {
    if (!selectedTicketType) {
      setErrors({ general: 'Please select a ticket type first' });
      return;
    }

    const rowSeats = seatingLayout.seats.filter(s => s.row === rowLabel);
    if (!rowSeats.length) return;

    if (selectionMode === 'checkbox') {
      // toggle selection of unassigned or currently selectable seats
      const unassignedInRow = rowSeats.filter(s => {
        const assigned = getAssignedTypeIdForSeat(s.seatId);
        return !assigned || assigned === selectedTicketType;
      });

      if (!unassignedInRow.length) {
        setErrors({ general: 'All seats in this row are already assigned to other types' });
        return;
      }

      const newSelected = new Set(selectedSeats);
      const allSelected = unassignedInRow.every(s => newSelected.has(s.seatId));

      if (allSelected) {
        unassignedInRow.forEach(s => newSelected.delete(s.seatId));
      } else {
        unassignedInRow.forEach(s => newSelected.add(s.seatId));
      }

      setSelectedSeats(newSelected);
      setErrors({});
      return;
    }

    // Non-checkbox behavior: attempt to assign the whole row immediately (respecting capacity)
    const unassignedInRow = rowSeats.filter(s => !getAssignedTypeIdForSeat(s.seatId));
    if (!unassignedInRow.length) {
      setErrors({ general: 'All seats in this row are already assigned' });
      return;
    }

    const remaining = getRemainingCapacity(selectedTicketType);
    if (unassignedInRow.length > remaining) {
      setErrors({ general: `Cannot assign ${unassignedInRow.length} seats. Only ${remaining} remaining for this ticket type.` });
      return;
    }

    const newAssignments = { ...assignments };
    if (!Array.isArray(newAssignments[selectedTicketType])) newAssignments[selectedTicketType] = [];

    unassignedInRow.forEach(seat => {
      if (!newAssignments[selectedTicketType].includes(seat.seatId)) {
        newAssignments[selectedTicketType].push(seat.seatId);
      }
    });

    setAssignments({ ...newAssignments });
    setSelectedRow(rowLabel);
    setErrors({});
    // small visual reset
    setTimeout(() => {
      setSelectedRow(null);
    }, 120);
  };

  const handleSeatClick = (seat) => {
    if (!selectedTicketType) {
      setErrors({ general: 'Please select a ticket type first' });
      return;
    }
    const currentAssignment = getAssignedTypeIdForSeat(seat.seatId);
    if (selectionMode === 'single') {
      const newAssignments = { ...assignments };
      if (currentAssignment === selectedTicketType) {
        newAssignments[selectedTicketType] = (newAssignments[selectedTicketType] || []).filter(id => id !== seat.seatId);
        if (newAssignments[selectedTicketType].length === 0) delete newAssignments[selectedTicketType];
        console.log('❌ Unassigned seat:', seat.seatId);
        setAssignments({ ...newAssignments });
        setErrors({});
        return;
      }
      // if assigned to other type -> block
      if (currentAssignment && currentAssignment !== selectedTicketType) {
        setErrors({ general: 'Seat already assigned. Remove from other ticket type first.' });
        return;
      }
      // Get the ticket object to extract price
      const ticket = ticketTypes.find(t => t.id === selectedTicketType);
      const ticketPrice = ticket?.price || ticket?.ticket_price || 0;
      console.log(`💰 Assigning seat ${seat.seatId} with price: ₹${ticketPrice}`);
      // check capacity
      const remaining = getRemainingCapacity(selectedTicketType);
      if (remaining <= 0) {
        setErrors({ general: 'Ticket type capacity reached' });
        return;
      }

      // assign with color
      if (!Array.isArray(newAssignments[selectedTicketType])) {
        newAssignments[selectedTicketType] = [];
      }
      newAssignments[selectedTicketType].push(seat.seatId);
      
      console.log('✅ Assigned seat:', seat.seatId, 'to', selectedTicketType);
      console.log('Color:', getTicketTypeColorLocal(selectedTicketType));

      setAssignments({ ...newAssignments });
      setErrors({});
      return;
    }
    if (selectionMode === 'checkbox') {
      // allow toggling only if unassigned or assigned to same type
      if (currentAssignment && currentAssignment !== selectedTicketType) {
        setErrors({ general: 'Cannot select seats assigned to other ticket types' });
        return;
      }
      const updated = new Set(selectedSeats);
      if (updated.has(seat.seatId)) updated.delete(seat.seatId);
      else updated.add(seat.seatId);
      setSelectedSeats(updated);
      setErrors({});
      return;
    }

    // range mode
    if (selectionMode === 'range') {
      if (currentAssignment && currentAssignment !== selectedTicketType) {
        setErrors({ general: 'Cannot select seats assigned to other ticket types' });
        return;
      }

      if (!rangeStart) {
        setRangeStart(seat);
        setRangeEnd(null);
        setErrors({});
        return;
      }

      if (rangeStart && !rangeEnd && seat.seatId !== rangeStart.seatId) {
        setRangeEnd(seat);
        setErrors({});
        return;
      }

      // reset if clicked same start or both already present
      setRangeStart(seat);
      setRangeEnd(null);
      setErrors({});
    }
  };
const applyCheckboxSelection = () => {
  if (!selectedTicketType || selectedSeats.size === 0) return;

  const selectedArray = Array.from(selectedSeats);
  const remaining = getRemainingCapacity(selectedTicketType);
  if (selectedArray.length > remaining) {
    setErrors({ general: `Cannot assign ${selectedArray.length} seats. Only ${remaining} remaining for this ticket type.` });
    return;
  }

  const newAssignments = { ...assignments };
  if (!Array.isArray(newAssignments[selectedTicketType])) {
    newAssignments[selectedTicketType] = [];
  }

  selectedArray.forEach(seatId => {
    if (!newAssignments[selectedTicketType].includes(seatId)) {
      newAssignments[selectedTicketType].push(seatId);
    }
  });
  setAssignments({ ...newAssignments });
  setSelectedSeats(new Set());
  setErrors({});
};
const applyRangeSelection = () => {
  if (!selectedTicketType || !rangeStart || !rangeEnd) return;

  const seats = seatingLayout.seats;
  const startIdx = seats.findIndex(s => s.seatId === rangeStart.seatId);
  const endIdx = seats.findIndex(s => s.seatId === rangeEnd.seatId);
  const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

  const rangeSeats = seats.slice(from, to + 1)
    .filter(s => !getAssignedTypeIdForSeat(s.seatId))
    .map(s => s.seatId);

  const remaining = getRemainingCapacity(selectedTicketType);
  if (rangeSeats.length > remaining) {
    setErrors({ general: `Cannot assign ${rangeSeats.length} seats. Only ${remaining} remaining for this ticket type.` });
    return;
  }

  const newAssignments = { ...assignments };
  if (!Array.isArray(newAssignments[selectedTicketType])) {
    newAssignments[selectedTicketType] = [];
  }
  
  rangeSeats.forEach(id => {
    if (!newAssignments[selectedTicketType].includes(id)) {
      newAssignments[selectedTicketType].push(id);
    }
  });

  console.log('✅ Applied range selection with color for:', selectedTicketType);
  console.log('Color:', getTicketTypeColorLocal(selectedTicketType));

  setAssignments({ ...newAssignments });
  setRangeStart(null);
  setRangeEnd(null);
  setErrors({});
};

  const removeTicketTypeAssignments = (ticketTypeId) => {
    const newAssignments = { ...assignments };
    delete newAssignments[ticketTypeId];
    setAssignments({ ...newAssignments });
  };

  const clearAssignments = () => {
    setAssignments({});
    setSelectedSeats(new Set());
    setRangeStart(null);
    setRangeEnd(null);
    setErrors({});
  };

  const handleSave = () => {
    // capacity validation
    const validationErrors = {};
    ticketTypes.forEach(ticket => {
      const assigned = getAssignedCount(ticket.id);
      if (assigned > ticket.capacity) {
        validationErrors[ticket.id] = `Too many seats assigned (${assigned}/${ticket.capacity})`;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors({ ...validationErrors, general: 'Some ticket types exceed their capacity' });
      return;
    }

    // callback
    onSave(assignments);
    onClose();
  };

  // Layout helpers
  const seatsByRow = seatingLayout.rows.map(row => (
    seatingLayout.seats.filter(seat => seat.row === row).sort((a, b) => a.column - b.column)
  ));
  const maxSeatsInRow = Math.max(...seatsByRow.map(r => r.length));
  const layoutStyle = seatingLayout.layoutStyle || 'image_detected';
  const isShapedLayout = (() => {
    if (seatsByRow.length < 3) return false;
    const rowWidths = seatsByRow.map(r => r.length);
    const firstWidth = rowWidths[0];
    const lastWidth = rowWidths[rowWidths.length - 1];
    const middleWidth = rowWidths[Math.floor(rowWidths.length / 2)];
    const isIncreasing = lastWidth > firstWidth * 1.3;
    const isDecreasing = firstWidth > lastWidth * 1.3;
    const isOval = middleWidth > Math.max(firstWidth, lastWidth) * 1.2;
    return isIncreasing || isDecreasing || isOval || layoutStyle !== 'grid';
  })();

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-75 flex items-center justify-center p-2">
      <div className={`w-full h-full max-w-[98vw] max-h-[98vh] rounded-lg overflow-hidden flex flex-col ${darkMode ? 'bg-[#2B2B2B]' : 'bg-white'}`}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assign Seats to Ticket Types</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(98vh - 180px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Controls */}
            <div className="space-y-4">
              {/* Ticket Types */}
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Select Ticket Type</h3>
                <div className="space-y-1.5">
                  {ticketTypes.map(ticket => {
                    const assigned = getAssignedCount(ticket.id);
                    const remaining = getRemainingCapacity(ticket.id);
                    const color = getTicketTypeColorLocal(ticket.id);
                    const isComplete = remaining === 0;
                    return (
                      <div key={ticket.id} className="relative">
                        <button
                          onClick={() => { setSelectedTicketType(ticket.id); setErrors({}); }}
                          className={`w-full p-2.5 rounded-lg border transition-all text-left ${selectedTicketType === ticket.id ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'} ${darkMode ? 'bg-[#1c1c1f]' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded flex-shrink-0 border-2 border-white" style={{ backgroundColor: color }} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ticket.name}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{assigned}/{ticket.capacity} seats {isComplete && <span className="ml-1 text-green-500">✓</span>}</p>
                            </div>
                          </div>
                        </button>

                        {assigned > 0 && (
                          <button onClick={() => removeTicketTypeAssignments(ticket.id)} className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition" title="Remove all assignments">×</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selection Mode */}
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Selection Mode</h3>
                <div className="space-y-1.5">
                  {[
                    { mode: 'single', label: 'Single', desc: 'Click seats individually' },
                    { mode: 'checkbox', label: 'Multiple', desc: 'Select then apply' },
                    { mode: 'range', label: 'Range', desc: 'Pick start & end' }
                  ].map(({ mode, label, desc }) => (
                    <button
                      key={mode}
                      onClick={() => { setSelectionMode(mode); setSelectedSeats(new Set()); setRangeStart(null); setRangeEnd(null); }}
                      className={`w-full p-2 rounded-lg border transition text-left ${selectionMode === mode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {errors.general && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-2">
                  <p className="text-xs text-red-700 dark:text-red-300">{errors.general}</p>
                </div>
              )}

              <button onClick={clearAssignments} className="w-full px-3 py-1.5 text-sm border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">Clear All</button>
            </div>

            {/* Seating layout */}
            <div className="lg:col-span-3">
              {/* Zoom controls */}
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Seating Layout</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                      const c = document.getElementById('seat-map-container');
                      if (!c) return;
                      const cur = parseFloat(c.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const n = Math.max(0.5, cur - 0.1);
                      c.style.transform = `scale(${n})`;
                      c.style.transformOrigin = 'top left';
                    }} className={`p-2 rounded-lg transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title="Zoom Out">-</button>

                  <button onClick={() => {
                      const c = document.getElementById('seat-map-container');
                      if (!c) return;
                      c.style.transform = 'scale(1)';
                    }} className={`px-3 py-1 text-xs rounded-lg transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title="Reset Zoom">100%</button>

                  <button onClick={() => {
                      const c = document.getElementById('seat-map-container');
                      if (!c) return;
                      const cur = parseFloat(c.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const n = Math.min(2, cur + 0.1);
                      c.style.transform = `scale(${n})`;
                      c.style.transformOrigin = 'top left';
                    }} className={`p-2 rounded-lg transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title="Zoom In">+</button>
                </div>
              </div>

              <div className={`rounded-lg border p-4 overflow-auto ${darkMode ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'}`}>
                <div className="bg-gradient-to-b from-gray-800 to-gray-700 text-white text-center py-2 rounded-lg mb-4">
                  <div className="text-xs font-semibold tracking-wider">STAGE / SCREEN</div>
                </div>

                <div id="seat-map-container" className="space-y-2 max-h-[500px] transition-transform duration-200" style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                  {seatsByRow.map((rowSeats, rowIndex) => {
                    const rowLabel = seatingLayout.rows[rowIndex];
                    const seatsInRow = rowSeats.length;
                    const centerOffset = isShapedLayout ? `${((maxSeatsInRow - seatsInRow) / 2) * 42}px` : '0px';

                    // For visuals: check if whole row assigned to the selected ticket type
                    const rowAssignedSeatsForCurrentType = rowSeats.filter(s => getAssignedTypeIdForSeat(s.seatId) === selectedTicketType);
                    const isRowFullyAssigned = rowAssignedSeatsForCurrentType.length === rowSeats.length && rowSeats.length > 0;

                    return (
                      <div key={rowLabel} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {selectionMode === 'checkbox' && (
                            <input
                              type="checkbox"
                              checked={rowSeats.every(seat => {
                                const assigned = getAssignedTypeIdForSeat(seat.seatId);
                                return assigned === selectedTicketType || selectedSeats.has(seat.seatId);
                              })}
                              onChange={() => handleRowClick(rowLabel)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              disabled={!selectedTicketType}
                              title="Select all seats in this row"
                            />
                          )}

                          <button
                            onClick={() => selectionMode !== 'checkbox' && handleRowClick(rowLabel)}
                            className={`w-7 text-center font-bold text-sm cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded transition ${selectedRow === rowLabel ? 'bg-indigo-200 dark:bg-indigo-800' : ''} ${isRowFullyAssigned ? 'bg-green-100 dark:bg-green-900' : ''} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            title={selectionMode === 'checkbox' ? 'Use checkbox to select row' : 'Click to select entire row'}
                            disabled={selectionMode === 'checkbox'}
                          >
                            {rowLabel}
                          </button>
                        </div>

                        <div className="flex gap-1 flex-wrap" style={{ marginLeft: centerOffset }}>
                          {rowSeats.map(seat => {
                            const assignedTypeId = getAssignedTypeIdForSeat(seat.seatId);
                            const assignedColor = assignedTypeId ? getTicketTypeColorLocal(assignedTypeId) : null;
                            const isAssigned = !!assignedTypeId;
                            const isCurrentType = assignedTypeId === selectedTicketType;
                            const isInCheckboxSelection = selectedSeats.has(seat.seatId);
                            const isRangeStart = rangeStart?.seatId === seat.seatId;
                            const isRangeEnd = rangeEnd?.seatId === seat.seatId;

                            // in-range detection
                            const seatIndex = seatingLayout.seats.findIndex(s => s.seatId === seat.seatId);
                            const startIndex = rangeStart ? seatingLayout.seats.findIndex(s => s.seatId === rangeStart.seatId) : -1;
                            const endIndex = rangeEnd ? seatingLayout.seats.findIndex(s => s.seatId === rangeEnd.seatId) : -1;
                            const isInRange = rangeStart && rangeEnd && seatIndex >= Math.min(startIndex, endIndex) && seatIndex <= Math.max(startIndex, endIndex);
                            let backgroundColor = darkMode ? '#6B7280' : '#D1D5DB';
                            let showPreviewColor = false;
                            if (isAssigned) {
                              // PRIORITY 1: Show saved assignment color
                              backgroundColor = assignedColor;
                            } else if (selectedTicketType) {
                              // PRIORITY 2: Show preview color for interactions
                              const previewHex = getTicketTypeColorLocal(selectedTicketType);
                              
                              if (selectionMode === 'single') {
                                // In single mode, hovering shows preview
                                showPreviewColor = hoveredSeat?.seatId === seat.seatId;
                                if (showPreviewColor) {
                                  backgroundColor = hexToRgba(previewHex, 0.7);
                                }
                              } else if (selectionMode === 'checkbox' && isInCheckboxSelection) {
                                backgroundColor = previewHex;
                                showPreviewColor = true;
                              } else if (isRangeStart || isRangeEnd) {
                                backgroundColor = previewHex;
                                showPreviewColor = true;
                              } else if (isInRange) {
                                backgroundColor = hexToRgba(previewHex, 0.5);
                                showPreviewColor = true;
                              }
                            }
                            const borderStyle = isRangeStart ? '3px solid #FCD34D' : isRangeEnd ? '3px solid #FB923C' : (isAssigned ? '3px solid rgba(255,255,255,0.9)' : isInCheckboxSelection ? '2px solid rgba(255,255,255,0.6)' : 'none');
                            const boxShadow = (isAssigned || isInCheckboxSelection || isRangeStart || isRangeEnd) ? '0 2px 8px rgba(0,0,0,0.4)' : 'none';
                            const disabledForSingle = isAssigned && !isCurrentType && selectionMode === 'single';

                            return (
                                  <button
                                    key={seat.seatId}
                                    onClick={() => handleSeatClick(seat)}
                                    onMouseEnter={() => setHoveredSeat(seat)}
                                    onMouseLeave={() => setHoveredSeat(null)}
                                    disabled={disabledForSingle}
                                    className={`w-9 h-9 rounded text-xs font-semibold transition-all relative ${
                                      isInCheckboxSelection ? 'ring-2 ring-indigo-500 scale-105' : ''
                                    } ${
                                      isRangeStart ? 'ring-4 ring-yellow-500 scale-110' : ''
                                    } ${
                                      isRangeEnd ? 'ring-4 ring-orange-500 scale-110' : ''
                                    } ${
                                      isInRange && !isAssigned ? 'ring-2 ring-yellow-300' : ''
                                    } ${
                                      isAssigned && !isCurrentType && selectionMode === 'single' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                                    }`}
                                    style={{
                                      backgroundColor: (() => {
                                        // PRIORITY 1: Check if seat is in current assignments state (including pending)
                                        const assignedTypeId = getAssignedTypeIdForSeat(seat.seatId);
                                        
                                        if (assignedTypeId) {
                                          const color = getTicketTypeColorLocal(assignedTypeId);
                                          console.log(`✅ Seat ${seat.seatId} assigned to ${assignedTypeId} with color ${color}`);
                                          return color; // Return the actual ticket type color
                                        }
                                        
                                        // PRIORITY 2: Check selection preview states
                                        if (selectedTicketType) {
                                          const previewColor = getTicketTypeColorLocal(selectedTicketType);
                                          
                                          // Checkbox mode - preview for checked seats
                                          if (selectionMode === 'checkbox' && isInCheckboxSelection) {
                                            return hexToRgba(previewColor, 0.7); // Semi-transparent preview
                                          }
                                          
                                          // Range mode - preview for range selection
                                          if (selectionMode === 'range') {
                                            if (isRangeStart || isRangeEnd) {
                                              return previewColor;
                                            }
                                            if (isInRange) {
                                              return hexToRgba(previewColor, 0.5);
                                            }
                                          }
                                          
                                          // Single mode - preview on hover
                                          if (selectionMode === 'single' && hoveredSeat?.seatId === seat.seatId) {
                                            return hexToRgba(previewColor, 0.7);
                                          }
                                        }
                                        
                                        // DEFAULT: Gray only for truly unassigned seats
                                        return darkMode ? '#4B5563' : '#D1D5DB';
                                      })(),
                                      color: '#FFFFFF',
                                      border: isRangeStart 
                                        ? '3px solid #FCD34D' 
                                        : isRangeEnd 
                                          ? '3px solid #FB923C' 
                                          : assignedTypeId 
                                            ? '3px solid rgba(255,255,255,0.9)' 
                                            : isInCheckboxSelection 
                                              ? '2px solid rgba(255,255,255,0.6)' 
                                              : 'none',
                                      boxShadow: (assignedTypeId || isInCheckboxSelection || isRangeStart || isRangeEnd) 
                                        ? '0 2px 8px rgba(0,0,0,0.4)' 
                                        : 'none',
                                      opacity: 1,
                                    }}
                                    title={
                                      isRangeStart ? `Range Start: ${seat.seatId}` :
                                      isRangeEnd ? `Range End: ${seat.seatId}` :
                                      isAssigned ? (() => {
                                        const ticket = ticketTypes.find(t => t.id === assignedTypeId);
                                        const price = ticket?.price || ticket?.ticket_price || 0;
                                        return `${seat.seatId} - ${ticket?.name || assignedTypeId}${price > 0 ? ` - ₹${price}` : ''}`;
                                      })() :
                                      seat.seatId
                                    }
                                  >
                                    <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M4 18v3h3v-3h10v3h3v-6H4v3zm15-8h3v3h-3v-3zM2 10h3v3H2v-3zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z"/>
                                    </svg>

                                    {/* Assigned checkmark */}
                                    {isAssigned && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                                        <svg className={`w-3 h-3 ${isCurrentType ? 'text-green-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}

                                    {/* Checkbox preview check for unassigned */}
                                    {isInCheckboxSelection && !isAssigned && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                                        <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}

                                    {isRangeStart && (
                                      <div className="absolute -top-2 -left-2 bg-yellow-500 text-white text-[10px] font-bold px-1 rounded shadow">START</div>
                                    )}
                                    {isRangeEnd && (
                                      <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1 rounded shadow">END</div>
                                    )}
                                  </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className={`flex-shrink-0 p-4 border-t ${darkMode ? 'border-gray-700 bg-[#2B2B2B]' : 'border-gray-200 bg-white'}`}>
          <div className="space-y-3">
            {/* Current Assignments Display */}
            {(Object.keys(assignments).length > 0 || selectedSeats.size > 0 || (rangeStart && rangeEnd)) && (
              <div className="pb-3 border-b border-gray-300 dark:border-gray-600">
                <p className={`text-sm font-semibold mb-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectionMode === 'single' ? 'Saved Assignments:' : 'Current Assignments:'}
                </p>
                <div className="flex flex-wrap gap-3 justify-center items-center">
                  {ticketTypes.map(ticket => {
                    const savedCount = getAssignedCount(ticket.id);
                    
                    // Calculate pending/preview count based on mode
                    let pendingCount = 0;
                    
                    if (String(selectedTicketType) === String(ticket.id)) {
                      if (selectionMode === 'checkbox') {
                        // Count selected seats that aren't already assigned
                        pendingCount = Array.from(selectedSeats).filter(seatId => {
                          const currentAssignment = getAssignedTypeIdForSeat(seatId);
                          return !currentAssignment || currentAssignment === ticket.id;
                        }).length;
                      } else if (selectionMode === 'range' && rangeStart && rangeEnd) {
                        // Count seats in range that aren't already assigned
                        const seats = seatingLayout.seats;
                        const startIdx = seats.findIndex(s => s.seatId === rangeStart.seatId);
                        const endIdx = seats.findIndex(s => s.seatId === rangeEnd.seatId);
                        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
                        
                        pendingCount = seats.slice(from, to + 1).filter(s => {
                          const currentAssignment = getAssignedTypeIdForSeat(s.seatId);
                          return !currentAssignment || currentAssignment === ticket.id;
                        }).length;
                      }
                    }
                    
                    const totalCount = savedCount + pendingCount;
                    
                    // Only show if there are saved or pending assignments
                    if (totalCount === 0) return null;
                    
                    const color = getTicketTypeColorLocal(ticket.id);
                    const isOverCapacity = totalCount > ticket.capacity;
                    
                    return (
                      <div 
                        key={ticket.id} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 shadow-sm ${
                          isOverCapacity 
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600' 
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div 
                          className="w-6 h-6 rounded border-2 border-white shadow-md flex-shrink-0" 
                          style={{ backgroundColor: color }} 
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {ticket.name}:
                          </span>
                          <div className="flex items-baseline gap-1">
                            {/* Saved count */}
                            <strong className={`text-lg ${isOverCapacity ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                              {savedCount}
                            </strong>
                            
                            {/* Pending count indicator */}
                            {pendingCount > 0 && (
                              <>
                                <span className="text-gray-500 dark:text-gray-400">+</span>
                                <span className="text-orange-500 dark:text-orange-400 text-sm font-semibold">
                                  {pendingCount}
                                </span>
                                <span className="text-xs text-orange-500 dark:text-orange-400">(pending)</span>
                              </>
                            )}
                            {/* Total capacity */}
                              <span className={`text-sm ${isOverCapacity ? 'text-red-500' : 'text-gray-500'}`}>
                                / {ticket.capacity}
                              </span>
                          </div>
                          {savedCount > 0 && (() => {
                            const ticketPrice = ticketTypes.find(t => t.id === ticket.id)?.capacity || 0;
                            const totalRevenue = savedCount * ticketPrice;
                            return totalRevenue > 0 ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                ₹{ticketPrice} × {savedCount} = ₹{totalRevenue.toLocaleString()}
                              </span>
                            ) : null;
                          })()}
                          {/* Over capacity warning */}
                          {isOverCapacity && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              ⚠ Exceeds capacity by {totalCount - ticket.capacity}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Show message if no tickets selected yet */}
                  {ticketTypes.every(t => getAssignedCount(t.id) === 0) && selectedSeats.size === 0 && !rangeStart && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No seats assigned yet. Select a ticket type and click seats to begin.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="flex justify-between items-center gap-6">
              {/* Total seats summary */}
              <div className="text-sm">
                <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total: <strong className="text-lg text-indigo-600 dark:text-indigo-400">{getTotalAssigned()}</strong>
                  <span className="text-gray-500"> / {seatingLayout.seats.length} seats</span>
                </p>
                {getTotalAssigned() < seatingLayout.seats.length && (
                  <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                    <strong className="text-base">{getUnassignedSeats().length}</strong> seats remaining
                  </p>
                )}
                
                {/* Selection mode indicator */}
                {selectedTicketType && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mode: <span className="font-semibold">{selectionMode === 'single' ? 'Single Click' : selectionMode === 'checkbox' ? 'Multiple Select' : 'Range Select'}</span>
                    {selectionMode === 'checkbox' && selectedSeats.size > 0 && (
                      <span className="ml-2 text-orange-500">({selectedSeats.size} selected)</span>
                    )}
                    {selectionMode === 'range' && rangeStart && !rangeEnd && (
                      <span className="ml-2 text-yellow-500">(select end point)</span>
                    )}
                    {selectionMode === 'range' && rangeStart && rangeEnd && (
                      <span className="ml-2 text-orange-500">(range ready)</span>
                    )}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                {/* Apply button for checkbox/range modes */}
                {selectedTicketType && (
                  (selectionMode === 'checkbox' && selectedSeats.size > 0) || 
                  (selectionMode === 'range' && rangeStart && rangeEnd)
                ) && (
                  <button 
                    onClick={() => {
                      if (selectionMode === 'checkbox') applyCheckboxSelection();
                      else if (selectionMode === 'range') applyRangeSelection();
                    }} 
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2 text-base shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {selectionMode === 'checkbox' 
                      ? `Apply Selection (${selectedSeats.size})` 
                      : 'Apply Range'}
                  </button>
                )}

                <button 
                  onClick={onClose} 
                  className={`px-8 py-3 rounded-lg font-semibold transition text-base ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                
                <button 
                  onClick={handleSave} 
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2 text-base shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SeatAssignmentModal;
