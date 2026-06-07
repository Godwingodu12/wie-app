import axios from "axios";
const TRANSACTION_API_URL =
  process.env.NEXT_PUBLIC_TRANSACTION_API_URL || "http://localhost:5007/api";
// Create axios instance
const transactionApi = axios.create({
  baseURL: TRANSACTION_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
// Add auth token to requests
transactionApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
// Response interceptor
transactionApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "Transaction API Error:",
      error.response?.data || error.message,
    );
    return Promise.reject(error);
  },
);
export interface RegisterFreeEventResponse {
  success: boolean;
  requiresPayment: boolean; // true when addons need Razorpay
  message: string;
  data: {
    booking: any;
    qrCode?: string;
    // Only present when requiresPayment === true
    razorpayOrder?: { id: string; amount: number; currency: string };
    razorpayKeyId?: string;
  };
}
export interface CustomQuestionAnswer {
  question_id: string;
  question_text: string;
  answer_type: string;
  answer_value: string | number | boolean;
}

export interface QuestionAnswers {
  name?: string;
  email?: string;
  phone_number?: string;
  position?: string;
  custom_answers?: Record<string, string | number | boolean>;
}

export interface CreateBookingRequest {
  ticketId: string;
  ticketTypeId: string;
  quantity: number;
  questionAnswers?: QuestionAnswers;
  foodAddon?: { selected: boolean; index: number } | null;
  accommodationAddon?: { selected: boolean; index: number } | null;
}

export interface FeeBreakdownLine {
  label: string;
  amount: number;
  note?: string;
}

export interface FeeBreakdown {
  lines: FeeBreakdownLine[];
  subtotal: number;
  platformFee: number;
  foodAddonAmount: number;
  accommodationAddonAmount: number;
  addonTotal: number;
  total: number;
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  data: {
    booking: {
      id: string;
      bookingId: string;
      subtotal: number;
      platformFee: number;
      totalAmount: number;
      currency: string;
      feeBreakdown: FeeBreakdown;
      userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
      };
    };
    razorpayOrder: {
      id: string;
      amount: number;
      currency: string;
    };
    razorpayKeyId: string;
  };
}
export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
export interface QRPayload {
  bookingId: string;
  userId: string;
  ticketId: string;
  eventName: string;
  ticketType: string;
  quantity: number;
  holderName: string;
  userEmail?: string;
  userPhone?: string;
  eventDate: string;
  eventTime: string;
  eventEndDate?: string;
  venue: string;
  location?: string;
  paymentMethod: string;
  subtotal?: number;
  tax?: number;
  platformFee?: number;
  totalAmount: number;
  eventImage?: string;
  bookingStatus?: string;
  groupId?: string;
  v: number;
}

export interface Booking {
  id: string;
  bookingId: string;
  userId: string;
  ticketId: string;
  groupId: string;
  ticketType: string;
  quantity: number;
  pricePerTicket: number;
  subtotal: number;
  tax: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod?: string;
  bookingStatus: string;
  userDetails: any;
  eventDetails: any;
  qrCode?: string;
  qrPayload?: QRPayload | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  refundAmount?: number;
  refundStatus?: string;
  refundProcessedAt?: string;
  refundId?: string;
  refundInitiatedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  event_link?: string;
  event_code?: string;
}
export interface CreateSeatedBookingRequest {
  ticketId: string;
  selectedSeats: string[];
  questionAnswers?: any;
  foodAddon?: { selected: boolean; index: number } | null;
  accommodationAddon?: { selected: boolean; index: number } | null;
}
export interface CheckBookingResponse {
  success: boolean;
  hasBooked: boolean;
  hasPending: boolean;
  booking: Booking | null;
  eventMeta: {
    isFreeEvent: boolean;
    isRestrictedEvent: boolean;
    showViewTicket: boolean;
    paymentType: string | null;
    restrictBooking: boolean;
  };
}

export interface BookedSeatsResponse {
  success: boolean;
  data: {
    bookedSeats: string[];
  };
}

export interface CancelledBooking {
  id: string;
  bookingId: string;
  userId: string;
  ticketId: string;
  groupId: string;
  ticketType: string;
  quantity: number;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  eventDetails: any;
  userDetails: any;
  qrCode?: string;
  isVerified: boolean;
  // Cancellation
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy: "host" | "user";
  isAdminCancelled: boolean;
  // Refund
  refundAmount?: number;
  refundStatus?: string;
  refundId?: string;
  refundInitiatedAt?: string;
  refundProcessedAt?: string;
  latestRefundTransaction?: {
    id: string;
    amount: number;
    status: string;
    refundId?: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export const registerFreeEvent = async (
  ticketId: string,
  quantity: number,
  questionAnswers?: any,
  foodAddon?: { selected: boolean; index: number } | null,
  accommodationAddon?: { selected: boolean; index: number } | null,
  selectedSeats?: string[],
): Promise<RegisterFreeEventResponse> => {
  const response = await transactionApi.post('/bookings/register-free', {
    ticketId,
    quantity,
    ...(questionAnswers ? { questionAnswers } : {}),
    ...(foodAddon ? { foodAddon } : {}),
    ...(accommodationAddon ? { accommodationAddon } : {}),
    ...(selectedSeats && selectedSeats.length > 0 ? { selectedSeats } : {}),
  });
  return response.data;
};

export const createBooking = async (
  data: CreateBookingRequest,
): Promise<CreateBookingResponse> => {
  const response = await transactionApi.post("/bookings/create", data);
  return response.data;
};

export const createSeatedBooking = async (data: CreateSeatedBookingRequest) => {
  try {
    const res = await transactionApi.post("/bookings/create-seated", data);
    return res.data;
  } catch (err) {
    console.error("❌ createSeatedBooking error:", err);
    throw err;
  }
};

export const getBookedSeats = async (
  ticketId: string,
): Promise<BookedSeatsResponse> => {
  try {
    const res = await transactionApi.get(`/bookings/booked-seats/${ticketId}`);
    return res.data;
  } catch (err) {
    console.error("❌ getBookedSeats error:", err);
    throw err;
  }
};
export const verifyPayment = async (data: VerifyPaymentRequest) => {
  const response = await transactionApi.post("/bookings/verify-payment", data);
  return response.data;
};
export const getUserBookings = async (params?: {
  status?: string;
  limit?: number;
  skip?: number;
}) => {
  const response = await transactionApi.get("/bookings/my-bookings", {
    params,
  });
  return response.data;
};
export const getBookingById = async (bookingId: string) => {
  const response = await transactionApi.get(`/bookings/${bookingId}`);
  return response.data;
};
export const getGroupBookings = async (
  groupId: string,
  params?: {
    ticketId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  },
) => {
  const response = await transactionApi.get(
    `/admin/group/${groupId}/bookings`,
    { params },
  );
  return response.data;
};

export const getEventStatistics = async (ticketId: string) => {
  const response = await transactionApi.get(
    `/admin/event/${ticketId}/statistics`,
  );
  return response.data;
};

export const verifyTicketQR = async (qrData: string) => {
  const response = await transactionApi.post("/admin/verify-qr", { qrData });
  return response.data;
};

export const getEventFeedback = async (
  ticketId: string,
  params?: { limit?: number; skip?: number },
) => {
  const response = await transactionApi.get(
    `/admin/event/${ticketId}/feedback`,
    { params },
  );
  return response.data;
};

export const exportBookings = async (params: {
  groupId?: string;
  ticketId?: string;
}) => {
  const response = await transactionApi.get("/admin/export-bookings", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const getBookingAnalytics = async (params: {
  groupId?: string;
  ticketId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await transactionApi.get("/admin/analytics", { params });
  return response.data;
};

export const getTopEventsByRevenue = async (
  groupId: string,
  limit?: number,
) => {
  const response = await transactionApi.get(
    `/admin/group/${groupId}/top-events`,
    {
      params: { limit },
    },
  );
  return response.data;
};
export const cancelBooking = async (
  bookingId: string,
  cancellationReason: string,
) => {
  const response = await transactionApi.post(`/bookings/${bookingId}/cancel`, {
    cancellationReason,
  });
  return response.data;
};

// Interaction APIs
export const toggleLike = async (ticketId: string) => {
  const response = await transactionApi.post(`/interactions/${ticketId}/like`);
  return response.data;
};

export const shareEvent = async (ticketId: string, shareMethod: string) => {
  const response = await transactionApi.post(
    `/interactions/${ticketId}/share`,
    {
      shareMethod,
    },
  );
  return response.data;
};

export const recordView = async (ticketId: string) => {
  const response = await transactionApi.post(`/interactions/${ticketId}/view`);
  return response.data;
};

export const toggleSave = async (ticketId: string) => {
  const response = await transactionApi.post(`/interactions/${ticketId}/save`);
  return response.data;
};
export const unlikeEvent = async (ticketId: string) => {
  const response = await transactionApi.delete(
    `/interactions/${ticketId}/like`,
  );
  return response.data;
};

export const unsaveEvent = async (ticketId: string) => {
  const response = await transactionApi.delete(
    `/interactions/${ticketId}/save`,
  );
  return response.data;
};
export const getEventStats = async (ticketId: string) => {
  const response = await transactionApi.get(`/interactions/${ticketId}/stats`);
  return response.data;
};

export const submitFeedback = async (
  ticketId: string,
  rating: number,
  comment: string,
) => {
  const response = await transactionApi.post(
    `/interactions/${ticketId}/feedback`,
    {
      rating,
      comment,
    },
  );
  return response.data;
};
export const getUserLikedEvents = async (params?: {
  limit?: number;
  skip?: number;
}) => {
  const response = await transactionApi.get("/interactions/liked-events", {
    params,
  });
  return response.data;
};
export const getUserSavedEvents = async (params?: {
  limit?: number;
  skip?: number;
}) => {
  const response = await transactionApi.get("/interactions/saved-events", {
    params,
  });
  return response.data;
};

export const checkUserBooking = async (
  ticketId: string,
): Promise<CheckBookingResponse> => {
  const response = await transactionApi.get(`/bookings/check-booking/${ticketId}`);
  return response.data;
};

export const trackRefund = async (bookingId: string) => {
  const response = await transactionApi.get(
    `/bookings/${bookingId}/refund/track`,
  );
  return response.data;
};

export const getUserCancelledBookings = async (): Promise<{
  success: boolean;
  data: {
    cancelledBookings: CancelledBooking[];
    count: number;
    pendingRefunds: number;
    completedRefunds: number;
  };
}> => {
  const response = await transactionApi.get("/bookings/my-cancelled-bookings");
  return response.data;
};
export const getUserRehostedBookings = async (): Promise<{
  success: boolean;
  data: { events: any[]; count: number };
}> => {
  const response = await transactionApi.get("/bookings/my-rehosted-bookings");
  return response.data;
};

export const getUnreadCount = async (): Promise<{
  success: boolean;
  data: { confirmed: number; pending: number; cancelled: number };
}> => {
  const response = await transactionApi.get("/bookings/unread-count");
  return response.data;
};

export const markAsRead = async (
  params:
    | string
    | { bookingId?: string; bookingIds?: string[]; statuses?: string[] },
) => {
  const payload = typeof params === "string" ? { bookingId: params } : params;
  const response = await transactionApi.post("/bookings/mark-read", payload);
  return response.data;
};

export const getEventUserResponse = async (bookingId: string) => {
  const response = await transactionApi.get(`/bookings/${bookingId}/event-response`);
  return response.data;
};
// Cancel a PENDING booking when user dismisses Razorpay without paying
export const cancelPendingBooking = async (bookingId: string): Promise<void> => {
  try {
    await transactionApi.delete(`/bookings/pending/${bookingId}`);
  } catch (err) {
    // Non-fatal — log and swallow so it never breaks the UI
    console.warn("⚠️ cancelPendingBooking failed (non-fatal):", err);
  }
};

export default transactionApi;
