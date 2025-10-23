export enum TBookingStatus {
  pending = 'pending',
  accepted = 'accepted',
  inProgress = 'inProgress',
  cancelled = 'cancelled', 
  paymentRequest = 'paymentRequest',
  completed = 'completed'
}

export enum TPaymentStatus {
     unpaid = 'unpaid',
     paid = 'paid',
     refunded = 'refunded',
     failed = 'failed',
}