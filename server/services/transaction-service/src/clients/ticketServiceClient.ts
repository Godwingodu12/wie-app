import { getTicketById, getGroupById, updateTicketStats,getTicketBookingStats } from '../grpc/ticketClient';

export { getTicketById, getGroupById, updateTicketStats,getTicketBookingStats };

export const getTicketStats = async (ticketId: string): Promise<any> => {
  throw new Error('getTicketStats not implemented in gRPC - use direct database queries');
};
