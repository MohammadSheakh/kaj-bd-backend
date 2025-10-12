//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TBankAccount } from './bankInfo.constant';

export interface IBankInfo {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;   //🔗

  bankAccountNumber: string;
  bankRoutingNumber: string;
  bankAccountHolderName: string;
  bankAccountType: TBankAccount; // 🧩
  bankBranch: string;
  bankName: string;
  
  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBankInfoModel extends Model<IBankInfo> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IBankInfo>>;
}