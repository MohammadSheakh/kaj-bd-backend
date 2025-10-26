//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TWalletTransactionHistory, TWalletTransactionStatus } from './walletTransactionHistory.constant';
import { TCurrency } from '../../../enums/payment';
import { TTransactionFor } from '../../../constants/TTransactionFor';


export interface IWalletTransactionHistory {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  walletId: Types.ObjectId; //🔗
  userId: Types.ObjectId;   //🔗
  paymentTransactionId?: Types.ObjectId; //🔗
  withdrawalRequestId?: Types.ObjectId; //🔗

  type: TWalletTransactionHistory; //🧩 

  amount: number;
  currency: TCurrency; //🧩

  balanceBefore: number;
  balanceAfter: number;

  description?: string;

  status: TWalletTransactionStatus; //🧩 

  referenceFor: TTransactionFor; //🧩 
  referenceId: Types.ObjectId; // Id of referenceFor

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWalletTransactionHistoryModel extends Model<IWalletTransactionHistory> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IWalletTransactionHistory>>;
}