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
     paid = 'paid', // i think i dont need this
     refunded = 'refunded',
     failed = 'failed',
     completed = 'completed' // we use this 
     // need to check
}