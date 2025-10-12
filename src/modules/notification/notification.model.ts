//@ts-ignore
import { model, Schema } from 'mongoose';
import { INotification, INotificationModal } from './notification.interface';
import paginate from '../../common/plugins/paginate';
import { Roles } from '../../middlewares/roles';
import { TNotificationType } from './notification.constants';
import { TTransactionFor } from '../payment.module/paymentTransaction/paymentTransaction.constant';

const notificationModel = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
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
      enum: [
        TNotificationType      
      ],
      required: true,
    },

    linkFor: {
      type: String,
    },
    linkId: {
      type: String,
    },
    referenceFor: {
      type: String,
      enum: [
        TTransactionFor
      ],
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      refPath: "referenceFor",
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
