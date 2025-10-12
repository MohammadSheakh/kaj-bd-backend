import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TAppointmentStatus } from './doctorPatientScheduleBooking.constant';
import { PaymentMethod } from '../../order.module/order/order.constant';
import { TPaymentStatus } from '../specialistPatientScheduleBooking/specialistPatientScheduleBooking.constant';


export interface IDoctorPatientScheduleBooking {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  patientId: Types.ObjectId; //🔗
  doctorScheduleId: Types.ObjectId; //🔗
  doctorId: Types.ObjectId; //🔗
  status: TAppointmentStatus; // ENUM
  paymentTransactionId?: Types.ObjectId | null;
  paymentMethod: PaymentMethod | null; // ENUM
  paymentStatus: TPaymentStatus; // ENUM
  price: number; // required
  scheduleDate : Date; // TODO : is it should be string or Date 
  startTime : Date;
  endTime : Date;
  
  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}




export interface IDoctorPatientScheduleBookingModel extends Model<IDoctorPatientScheduleBooking> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IDoctorPatientScheduleBooking>>;
}