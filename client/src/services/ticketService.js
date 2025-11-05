import api from "./ticketAxiox";
export const getUserData = async () => {
  try {
    const response = await api.get("ticket/get-user-data");
    return response.data;
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
    const response = await api.post("ticket/delete-ticket", { data: { ticketId } });
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const deleteSubEvent = async (ticketId, subEventId) => {
  try {
    const response = await api.post(`ticket/delete-sub-event/${ticketId}/${subEventId}`);
    return response.data;
  }
  catch (error) {
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
export const getGroupView = async (ticketId) => {
  try {
    const response = await api.get(`ticket/get-group-view/${ticketId}`);
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
