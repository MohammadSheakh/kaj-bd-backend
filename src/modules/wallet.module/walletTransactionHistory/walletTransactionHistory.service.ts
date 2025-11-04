//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { WalletTransactionHistory } from './walletTransactionHistory.model';
import { IWalletTransactionHistory } from './walletTransactionHistory.interface';
import { GenericService } from '../../_generic-module/generic.services';

import { TCurrency } from '../../../enums/payment';

export class WalletTransactionHistoryService extends GenericService<
  typeof WalletTransactionHistory,
  IWalletTransactionHistory
> {
  constructor() {
    super(WalletTransactionHistory);
  }
}
