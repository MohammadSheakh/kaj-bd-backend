
export enum TPaymentGateway {
    stripe = 'stripe',
    paypal = 'paypal',
    sslcommerz = 'sslcommerz',
    none = 'none'
}
export enum TPaymentStatus {
    pending = 'pending',
    processing = 'processing',
    completed = 'completed',
    failed = 'failed',
    refunded = 'refunded',
    cancelled = 'cancelled',
    partially_refunded = 'partially_refunded',
    disputed = 'disputed'
}

export enum PaymentMethod {
    //  COD = 'Cod',
    //  CARD = 'Card',
     online = 'online',
}
