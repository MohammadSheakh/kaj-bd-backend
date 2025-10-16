import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { UserDevicesType } from './userDevices.constant';


export interface IUserDevices {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  deviceId: string;
  userId: Types.ObjectId; // FK to User (back reference)
  fcmToken: string;
  deviceType:  UserDevicesType; //🧩
  deviceName?: string;
  lastActive?: Date;

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDevicesModel extends Model<IUserDevices> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IUserDevices>>;
}