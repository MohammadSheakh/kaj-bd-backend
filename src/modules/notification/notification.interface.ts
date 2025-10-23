//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { TNotificationType } from './notification.constants';
import { TRole } from '../../middlewares/roles';

export interface INotification {
  _id?: Types.ObjectId;
  title: string;
  subTitle?: string;

  senderId?: Types.ObjectId;   // who triggered the notification
  receiverId?: Types.ObjectId; // specific user

  //---------------------------------
  // fallback role-based delivery
  // so that we can send notification to admin 
  //---------------------------------
  receiverRole: TRole;  //🧩         

  type : TNotificationType; //🧩

  idOfType : Types.ObjectId;  
  
  linkFor : string;
  linkId : string;

  viewStatus?: boolean;
  readAt?: Date;

  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationModal extends Model<INotification> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<INotification>>;
}
