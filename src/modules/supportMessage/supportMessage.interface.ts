import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

export interface ISupportMessage {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  creatorId: Types.ObjectId;
  supportMessage : string;
  attachments : Types.ObjectId[];
  isResolved : boolean;

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISupportMessageModel extends Model<ISupportMessage> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ISupportMessage>>;
}