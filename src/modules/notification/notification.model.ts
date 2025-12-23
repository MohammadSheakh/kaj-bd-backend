//@ts-ignore
import { model, Schema } from 'mongoose';
import { INotification, INotificationModal } from './notification.interface';
import paginate from '../../common/plugins/paginate';
import { Roles } from '../../middlewares/roles';
import { TNotificationType } from './notification.constants';

const notificationModel = new Schema<INotification>(
  {
    // title: {
    //   type: String,
    //   required: [true, "Title is required"],
    //   trim: true,
    // },
    title: {
      // type: String,
      // required: [true, 'Address is required'],
      en: {
        type: String, // 🧲 it shows it is required .. but we provide this
        required: [true, 'English address is required'],
        trim: true,
      },
      bn: {
        type: String, // 🧲 it shows it is required .. but we provide this
        required: [true, 'Bangla address is required'],
        trim: true,
      },
    },
    subTitle: {
      type: String,
      trim: true,
    },
    senderId: { // who triggered the notification
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    receiverId: { // specific user (doctor, specialist, patient)
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    receiverRole: { // fallback for role-based (admin, doctor, specialist, patient)
      type: String,
      enum: Roles,
      required: false, // for admin we must need role .. otherwise not required because we have id of that user 
    },

    type: {
      type: String,
      enum: 
        Object.values(TNotificationType)      
      ,
      required: true,
    },

    idOfType: {
      type: String,
      required: false,
    },

    linkFor: {
      type: String,
    },
    linkId: {
      type: String,
    },
    
    viewStatus: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationModel.plugin(paginate);

export const Notification = model<INotification, INotificationModal>(
  'Notification',
  notificationModel
);
