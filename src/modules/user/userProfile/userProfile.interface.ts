import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TApprovalStatus } from './userProfile.constant';


export interface IUserProfile {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  attachments: Types.ObjectId[]; 
  approvalStatus : TApprovalStatus.pending |
              TApprovalStatus.approved |
              TApprovalStatus.rejected;

  protocolNames : [string];
  howManyPrograms: number; // for specialist .. 
  howManyProtocol: number; // for patient .. 
  userId: Types.ObjectId; // for back reference ..
  description: string;
  address: string;

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserProfileModel extends Model<IUserProfile> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IUserProfile>>;
}