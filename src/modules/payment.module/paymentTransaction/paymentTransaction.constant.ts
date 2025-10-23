/********
 *
 * // TODO : This is part of global constant  .. in next project we will move it to global constant file in sha Allah
 * UserSubscription |
 * Order |
 * DoctorPatientScheduleBooking |
 * SpecialistPatientScheduleBooking |
 * TrainingProgramPurchase |
 * LabTestBooking |
 * ****** */
export enum TTransactionFor {
    UserSubscription = 'UserSubscription',
    Order = 'Order',
    DoctorPatientScheduleBooking = 'DoctorPatientScheduleBooking',
    SpecialistPatientScheduleBooking = 'SpecialistPatientScheduleBooking',
    TrainingProgramPurchase = 'TrainingProgramPurchase',
    LabTestBooking = 'LabTestBooking',
    WithdrawalRequst = 'WithdrawalRequst' // for creating WalletTransactionHistory | admin end
}
export enum TPaymentGateway {
    stripe = 'stripe',
    paypal = 'paypal',
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
