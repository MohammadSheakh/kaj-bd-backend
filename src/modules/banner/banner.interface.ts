//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

export interface IBanner {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  attachments: Types.ObjectId[]; //🔗🖼️

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBannerModel extends Model<IBanner> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IBanner>>;
}