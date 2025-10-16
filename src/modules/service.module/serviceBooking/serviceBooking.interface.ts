import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';


export interface IServiceBooking {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;
  message : string;

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceBookingModel extends Model<IServiceBooking> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IServiceBooking>>;
}