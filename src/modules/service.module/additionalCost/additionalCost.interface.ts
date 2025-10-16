import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';


export interface IAdditionalCost {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  serviceBookingId: Types.ObjectId; // 🔗 to ServiceBooking
  costName: string;
  price: number;
  proofImage?: Types.ObjectId[]; //🔗🖼️ 

  isDeleted? : boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdditionalCostModel extends Model<IAdditionalCost> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IAdditionalCost>>;
}