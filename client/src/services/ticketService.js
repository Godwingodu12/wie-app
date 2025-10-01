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
export const createTicketBasicInfo = async (formData) => {
  try {
    const response = await api.post(`ticket/create-event/${formData.groupId}`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
}
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
    const response = await api.delete("ticket/delete-ticket", { data: { ticketId } });
    return response.data;
  } catch (error) {
    throw error;
  }
}
export const getGroupView = async (ticketId) => {
  try {
    const response = await api.get(`ticket/get-group-view/${ticketId}`);
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
    const response = await api.get("ticket/my-live-events");
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
