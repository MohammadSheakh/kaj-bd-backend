//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TBookingStatus } from './serviceBooking.constant';


export interface IServiceBooking {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  userId: Types.ObjectId; //🔗
  providerId: Types.ObjectId;//🔗
  bookingDate: Date;
  completionDate?: Date;
  bookingTime: string;
  bookingMonth: string;
  status: TBookingStatus; //🧩
  address: {
    en: string;
    bn: string;
  };
  lat: string;
  long: string;
  duration: string;
  attachments: Types.ObjectId[]; //🔗
  starPrice: number;
  // otherPartsPrice: number;
  totalCost: number;

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