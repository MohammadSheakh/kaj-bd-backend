/********
 * UserSubscription | ServiceBooking
 * ****** */
export enum TTransactionFor {
    UserSubscription = 'UserSubscription',
    ServiceBooking = 'ServiceBooking', // -- Kaj BD
    WithdrawalRequst = 'WithdrawalRequst' // -- suplify + may be Kaj BD for creating WalletTransactionHistory | admin end
}