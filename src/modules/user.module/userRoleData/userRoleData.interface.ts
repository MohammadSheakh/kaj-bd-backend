import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TAdminStatus, TProviderApprovalStatus } from './userRoleData.constant';

export interface IUserRoleData {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId; // FK to User (back reference)
  // roleType: string;
  adminStatus?: TAdminStatus; //🧩
  providerApprovalStatus?: TProviderApprovalStatus; //🧩
  approvedAt?: Date;

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserRoleDataModel extends Model<IUserRoleData> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IUserRoleData>>;
}