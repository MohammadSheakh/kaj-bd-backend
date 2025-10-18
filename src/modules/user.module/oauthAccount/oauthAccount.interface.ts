//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';


export interface IOAuthAccount {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;
  authProvider: 'google' | 'apple';
  providerId: string; // e.g., Google's 'sub' or Apple's 'sub'
  email?: string; // optional, may be null
  isVerified: boolean;
  accessToken?: string; // should be encrypted before storage
  refreshToken?: string; // should be encrypted before storage
  tokenExpiry?: Date;
  
  isDeleted? : boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOAuthAccountModel extends Model<IOAuthAccount> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IOAuthAccount>>;
}