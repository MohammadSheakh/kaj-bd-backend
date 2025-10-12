export enum TWalletTransactionHistory {

  /** if money is going out from wallet */
  debit = 'debit',
  /** if money is coming into wallet */
  credit = 'credit',
  /** if money is withdrawn from wallet */
  withdrawal = 'withdrawal',
}

export enum TWalletTransactionStatus {

  /* transaction is completed */
  completed = 'completed',
  /* transaction is pending */
  pending = 'pending',
  /* transaction has failed */
  failed = 'failed',
}