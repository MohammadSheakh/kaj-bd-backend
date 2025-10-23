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
    serviceBooking = 'serviceBooking',
    withdrawal = 'withdrawal',
    payment = 'payment',
    system = 'system',
    newUser = 'newUser'
}