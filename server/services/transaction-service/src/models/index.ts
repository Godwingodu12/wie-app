export { BookingModel } from './booking.model';
export type { CreateBookingData, UpdateBookingData } from './booking.model';
export { InteractionModel } from './interaction.model';
export type { CreateInteractionData } from './interaction.model';
export { PaymentTransactionModel } from './paymentTransaction.model';
export type {
  CreatePaymentTransactionData,
  UpdatePaymentTransactionData,
} from './paymentTransaction.model';

// Re-export Prisma types
export type {
  Booking,
  Interaction,
  PaymentTransaction,
  BookingStatus,
  PaymentStatus,
  RefundStatus,
  InteractionType,
} from '../generated/prisma';