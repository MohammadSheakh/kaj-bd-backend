export const notificationFilters: string[] = ['receiverId'];

/***********
 * 
 * INotificationType must contain all the referenceFor values from TTransactionFor enum
 * booking |
 * training |
 * workout |
 * withdrawal |
 * payment |
 * system |
 * ***** */
export enum TNotificationType {
    // SubscriptionPlan = 'SubscriptionPlan',
    appointmentBooking = 'appointmentBooking',
    trainingProgramPurchase = 'trainingProgramPurchase',
    workoutClassPurchase = 'workoutClassPurchase',
    productOrder = 'productOrder',
    labTestBooking = 'labTestBooking',
    withdrawal = 'withdrawal',
    payment = 'payment',
    system = 'system',
    newUser = 'newUser'
}