import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';


export interface IServiceProvider {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;
  message : string;

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceProviderModel extends Model<IServiceProvider> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IServiceProvider>>;
}