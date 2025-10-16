import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IServiceCategory {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  attachments?: string[]; //🔗🖼️ only 1 can be used for icon
  name: string;
  createdBy: 'admin' | 'user';
  createdByUserId?: Types.ObjectId | null;
  isVisible?: boolean;

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceCategoryModel extends Model<IServiceCategory> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IServiceCategory>>;
}