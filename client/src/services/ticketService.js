import api from "./ticketAxiox";
export const getUserData = async () => {
  try {
    const response = await api.get("ticket/get-user-data");
    return response.data.user;
  } catch (error) {
    throw error;
  }
};
export const CreationGroup = async (formData) => {
  try {
    const response = await api.post("ticket/create-group", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const UpdateGroup = async (groupId, formData) => {
  try {
    const response = await api.put(`ticket/update-group/${groupId}`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getUserGroupCapabilities = async () => {
  try {
    const response = await api.get("ticket/user-group-capabilities");
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getGroups = async () => {
  try {
    const response = await api.get("ticket/get-groups");
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const createTicketBasicInfo = async (formData, ticketId = null) => {
  try {
    // Extract groupId from FormData if it's FormData object
    let groupId;
    if (formData instanceof FormData) {
      groupId = formData.get('groupId');
    } else {
      groupId = formData.groupId;
    }
    // Validate groupId exists
    if (!groupId || groupId === 'undefined') {
      throw new Error('Group ID is missing or invalid');
    }
    const url = ticketId 
      ? `ticket/create-event/${groupId}/${ticketId}`
      : `ticket/create-event/${groupId}`;
    const response = await api.post(url, formData);
    return response.data;
  } catch (error) {
    console.error('Error in createTicketBasicInfo:', error);
    throw error;
  }
};
export const updateTicketMedia = async (ticketId, formData) => {
  try {
    console.log('Calling API with ticketId:', ticketId);
    console.log('FormData contents:', Array.from(formData.entries()));
    const response = await api.post(`/ticket/update-ticket-media/${ticketId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API call error:', error.response?.data || error.message);
    throw error;
  }
};
export const updateTicketAddOns = async (ticketId, formData) => {
  try {
    const response = await api.post(`/ticket/ticket-addons/${ticketId}`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateSubEvent = async (ticketId, subEventId, formData) => {
  try {
    const response = await api.put(`/ticket/update-sub-event/${ticketId}/${subEventId}`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateTicketDetails = async (ticketId,apiFormData) => {
  try {
    const response = await api.post(`/ticket/update-ticket-details/${ticketId}`, apiFormData);
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const updateTicketTerms = async (ticketId, updateData) => {
  try {
    const response = await api.post(`/ticket/ticket-terms/${ticketId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating ticket terms:', error);
    throw error;
  }
};
export const submitTicket = async (formData) => {
  try {
    const response = await api.post("ticket/submit-ticket", formData);
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const viewTickets = async () => {
  try {
    const response = await api.get("ticket/view-tickets");
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getAllGroupTicketId = async () => {
  try {
    const response = await api.get("ticket/get-group-tickets");
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getTicketById = async (ticketId) => {
  try {
    const response = await api.get(`ticket/get-ticket/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getGroupsTypes = async () => {
  try {
    const response = await api.get("ticket/get-groups-types");
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const deleteTicket = async (ticketId) => {
  try {
    const response = await api.post(`ticket/delete-ticket/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const deleteSubEvent = async (ticketId, subEventId) => {
  try {
    const response = await api.post(`/ticket/delete-sub-event/${ticketId}/${subEventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAllDeletedEvents = async () => {
  try {
    const response = await api.get("ticket/get-all-deleted-events");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteEventPermenently = async (ticketId, options = {}) => {
  try {
    const response = await api.delete(`/ticket/delete-event-permanently/${ticketId}`, {
      data: {
        isSubEvent:    options.isSubEvent    || false,
        parentEventId: options.parentEventId || null,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const deleteAllEvents = async () => {
  try {
    const response = await api.post("ticket/delete-all-events");
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getDeletedEventById = async (eventId, subEventId = null) => {
  const url = subEventId
    ? `/ticket/get-deleted-event/${eventId}?subEventId=${subEventId}`
    : `/ticket/get-deleted-event/${eventId}`;
  const response = await api.get(url);
  return response.data;
};
export const recoverDeletedEvent = async (ticketId) => {
  try {
    const response = await api.put(`ticket/recover-deleted-event/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error("Error recovering deleted event:", error);
    throw error;
  }
};
export const getGroupView = async (ticketId) => {
  try {
    const response = await api.get(`/ticket/get-group-view/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getGroupById = async (groupId) => {
  try {
    const response = await api.get(`ticket/get-group-by-id/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getGroupById:', error.response?.data || error.message);
    throw error;
  }
};
export const getOtherGroupView = async (ticketId) => {
  try {
    const response = await api.get(`ticket/get-other-group-view/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getMyEvents = async () => {
  try {
    const response = await api.get("ticket/my-events");
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getMyEventById = async (ticketId) => {
  try {
    const response = await api.get(`ticket/my-event-view/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getMyLiveEvents = async () => {
  try {
    const response = await api.get("/ticket/my-live-events");
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getMyLiveEventView = async (ticketId) => {
  try {
    const response = await api.get(`ticket/my-live-event-view/${ticketId}`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const getMyPastEvents = async () => {
  try {
    const response = await api.get("ticket/my-past-events");
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getMyUpcomingEvents = async () => {
  try {
    const response = await api.get("ticket/my-upcoming-events");
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getOthersEvents = async(otherId)=>{
  try{
    const response = await api.get(`ticket/get-others-events/${otherId}`);
    return response.data;
  }catch(error){
    throw error;
  }
};
export const getOthersEventsById = async(otherId,ticketId)=>{
  try{
    const response = await api.get(`ticket/get-other-ticket-id/${otherId}/${ticketId}`);
    return response.data;
  }catch(error){
    throw error;
  }
};
export const getOtherLiveEvents = async(otherId)=>{
  try{
    const response = await api.get(`ticket/get-others-live-events/${otherId}`);
    return response.data;
  }catch(error){
    throw error;
  }
};
export const getOthersPastEvents = async(otherId)=>{
  try{
    const response = await api.get(`ticket/get-others-past-events/${otherId}`);
    return response.data;
  }catch(error){
    throw error;
  }
};
export const getGroupStatistics = async () => {
  try {
    const response = await api.get(`ticket/get-group-statistics`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const confirmEvent = async (ticketId) => {
  try {
    const response = await api.post(`ticket/confirm-event/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const goLiveEvent = async (ticketId) => {
  try {
    const response = await api.post(`ticket/go-live-event/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousEvents = async () => {
  try {
    const response = await api.get(`/ticket/get-previous-events`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const getMyPreviousEventView = async (ticketId) => {
  try {
    const response = await api.get(`/ticket/my-previous-event-view/${ticketId}`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const likeEvent = async(ticketId) => {
  try {
    const response = await api.post(`/tickets/like-event/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const unlikeEvent = async(ticketId) => {
  try {
    const response = await api.post(`/tickets/unlike-event/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const checkIfUserLiked = async (ticketId) => {
  try{
    const response = await api.get(`/tickets/check-user-liked/${ticketId}`);
    return response.data;
  }catch(error){
    throw error;
  }
};
export const checkUserLiked = async (ticketId) => {
  try{
    const response = await api.get(`/tickets/check-user-liked/${ticketId}`);
    return response.data;
  }catch(error){
      throw error;
    } 
};
export const showEventBankDetails = async () => {
  try {
    const response = await api.get(`ticket/show-event-bank-details`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const showAllBankDetails= async () => {
  try {
    const response = await api.get(`ticket/show-all-bank-details`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const LiveEventBankDetails = async () => {
  try {
    const response = await api.get(`ticket/live-event-bank-details`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const groupEventCount = async () => {
  try {
    const response = await api.get(`ticket/group-event-count`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const totalEventsCreatedCount = async () => {
  try {
    const response = await api.get(`ticket/total-events-created-count`);
    return response.data;
  }
  catch (error) {
    throw error;
  }
};
export const getPostalDetailsFromCoords = async (lat, lng) => {
  if (typeof lat !== "number" || typeof lng !== "number") {
    console.error("Geocoding service received invalid coordinates.");
    return null;
  }

  try {
    const response = await api.get(`ticket/get-postal-details`, {
      params: { lat, lng },
    });

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error(
      "Error in getPostalDetailsFromCoords API call:",
      error.response?.data || error.message
    );

    throw error;
  }
};
export const getEventMetrics = async (ticketId) => {
  try {
    const response = await api.get(`ticket/event-metrics/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getAddOnEventLiveView = async (subEventId) => {
  try {
    const response = await api.get(`ticket/addon-event-live-view/${subEventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousEventView = async (ticketId) => {
  try {
    const response = await api.get(`ticket/previous-event-view/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousSubEventView = async (subEventId) => {
  try {
    const response = await api.get(`ticket/previous-sub-event-view/${subEventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousEventMonthlyStats = async (ticketId) => {
  try {
    const response = await api.get(`ticket/previous-event-monthly-stats/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousSubEventMonthlyStats = async (subEventId) => {
  try {
    const response = await api.get(`ticket/previous-sub-event-monthly-stats/${subEventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousEventCapacityStats = async (ticketId) => {
  try {
    const response = await api.get(`ticket/previous-event-capacity-stats/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousSubEventCapacityStats = async (subEventId) => {
  try {
    const response = await api.get(`ticket/previous-sub-event-capacity-stats/${subEventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getPreviousEventStatistics = async (ticketId) => {
  try {
    const response = await api.get(`ticket/previous-event-statistics/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
// Update these functions with correct paths
export const getEventStatsByDate = async (ticketId, selectedDate) => {
  try {
    const response = await api.get(`/ticket/event-stats-by-date/${ticketId}`, {
      params: { selectedDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error in getEventStatsByDate:', error);
    throw error;
  }
};

export const getEventGrowthStats = async (ticketId, selectedDate, comparisonType) => {
  try {
    const response = await api.get(`/ticket/event-growth-stats/${ticketId}`, {
      params: { selectedDate, comparisonType }
    });
    return response.data;
  } catch (error) {
    console.error('Error in getEventGrowthStats:', error);
    throw error;
  }
};

export const getEventMonthlyChart = async (ticketId, year, month) => {
  try {
    const response = await api.get(`/ticket/event-monthly-chart/${ticketId}`, {
      params: { year, month }
    });
    return response.data;
  } catch (error) {
    console.error('Error in getEventMonthlyChart:', error);
    throw error;
  }
};
export const cancelEvent = async (ticketId, cancellationReason) => {
  try {
    const response = await api.post(`/ticket/cancel-event/${ticketId}`, {
      cancellation_reason: cancellationReason,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelSubEvent = async (ticketId, subEventId, cancellationReason) => {
  try {
    const response = await api.post(
      `/ticket/${ticketId}/sub-events/${subEventId}/cancel`,
      { cancellation_reason: cancellationReason }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getCancellationReport = async (ticketId, subEventId = null) => {
  try {
    // Build URL: use sub-event route if subEventId is provided
    const url = subEventId
      ? `/ticket/get-cancellation-report/${ticketId}/sub-event/${subEventId}`
      : `/ticket/get-cancellation-report/${ticketId}`;

    const response = await api.get(url, { responseType: 'blob' });

    // Verify we got an Excel file, not a JSON error
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await response.data.text();
      const json = JSON.parse(text);
      throw new Error(json.message || 'Report generation failed');
    }

    // Trigger download
    const fileName = subEventId
      ? `cancellation-report-sub-${subEventId}.xlsx`
      : `cancellation-report-${ticketId}.xlsx`;

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link    = document.createElement('a');
    link.href     = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    return true;

  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to download report');
      } catch {
        throw new Error('Failed to download report. Server error.');
      }
    }
    throw error;
  }
};

export const rehostEvent = async (ticketId, rehostAs) => {
  const response = await api.post(`/ticket/rehost-event/${ticketId}`, {
    rehost_as: rehostAs,
  });
  return response.data;
};

// ADD:
export const rehostSubEvent = async (parentTicketId, subEventId) => {
  const response = await api.post(
    `/ticket/${parentTicketId}/sub-events/${subEventId}/rehost`
  );
  return response.data;
};

export const goLiveSubEvent = async (parentTicketId, subEventId) => {
  const response = await api.post(
    `/ticket/${parentTicketId}/sub-events/${subEventId}/go-live`
  );
  return response.data;
};

export const recoverSubEvent = async (parentTicketId, subEventId) => {
  const response = await api.post(
    `/ticket/${parentTicketId}/sub-events/${subEventId}/recover`
  );
  return response.data;
};
export const getTicketAuditBySubEvent = async (parentEventId, subEventId) => {
  const response = await api.get(
    `/ticket/audit/sub-event/${parentEventId}/${subEventId}`
  );
  return response.data;
};

export const getEventFinancialSummary = async (ticketId) => {
  try {
    const response = await api.get(`/ticket/event-financial-summary/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getEventFinancialSummary:', error);
    throw error;
  }
};

export const getEventTransactions = async (ticketId, { limit = 50, offset = 0, status = 'all' } = {}) => {
  try {
    const response = await api.get(`/ticket/event-transactions/${ticketId}`, {
      params: { limit, offset, status },
    });
    return response.data;
  } catch (error) {
    console.error('Error in getEventTransactions:', error);
    throw error;
  }
};

export const initAttendance = (ticketId, subEventId = null) =>
  api.post(`/attendance/${ticketId}/init`, { subEventId });

export const scanAttendanceQR = (ticketId, qrData, subEventId = null) =>
  api.post(`/attendance/${ticketId}/scan`, { qrData, subEventId });

export const getAttendanceList = (ticketId, subEventId = null) =>
  api.get(`/attendance/${ticketId}`, { params: subEventId ? { subEventId } : {} });

export const downloadAttendance = (ticketId, format = 'excel', subEventId = null) => {
  const params = new URLSearchParams({ format });
  if (subEventId) params.append('subEventId', subEventId);
  return api.get(`/attendance/${ticketId}/download?${params}`, { responseType: 'blob' });
};
