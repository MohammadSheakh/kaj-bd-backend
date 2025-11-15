//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TBookingStatus, TPaymentStatus } from './serviceBooking.constant';
import { PaymentMethod } from '../../payment.module/paymentTransaction/paymentTransaction.constant';


export interface IServiceBooking {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  userId: Types.ObjectId; //🔗
  providerId: Types.ObjectId;//🔗
  providerDetailsId : Types.ObjectId;//🔗
  bookingDateTime: Date;
  completionDate?: Date;
  // bookingTime: string;
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
  startPrice: number;
  // otherPartsPrice: number;
  totalCost: number;

  adminPercentageOfStartPrice : number;

  hasReview: Boolean;

  paymentTransactionId?: Types.ObjectId;
  paymentMethod? : PaymentMethod; //🧩
  paymentStatus : TPaymentStatus; //🧩

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateServiceBooking{
  bookingDateTime?: IServiceBooking['bookingDateTime'];
  /**
   * we need to translate this to bn and en 
   * * */
  address: string;  
  lat : IServiceBooking['lat']; 
  long : IServiceBooking['long'];
  providerId : IServiceBooking['providerId'];
}

export interface IServiceBookingModel extends Model<IServiceBooking> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IServiceBooking>>;
}