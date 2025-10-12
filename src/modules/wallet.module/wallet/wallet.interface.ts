//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TCurrency } from '../../../enums/payment';
import { TWalletStatus } from './wallet.constant';

export interface IWallet {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId; //🔗
  amount: number;

  currency: TCurrency; //🧩 
  status?: TWalletStatus; //🧩 

  // userRole?: Roles; // uncomment if you decide to use userRole field

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWalletModel extends Model<IWallet> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IWallet>>;
}