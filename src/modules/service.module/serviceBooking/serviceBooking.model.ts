import { model, Schema } from 'mongoose';
import { IServiceBooking, IServiceBookingModel } from './ServiceBooking.interface';
import paginate from '../../common/plugins/paginate';


const ServiceBookingSchema = new Schema<IServiceBooking>(
  {
    userId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: [true, 'dateOfBirth is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

ServiceBookingSchema.plugin(paginate);

ServiceBookingSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
ServiceBookingSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._ServiceBookingId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const ServiceBooking = model<
  IServiceBooking,
  IServiceBookingModel
>('ServiceBooking', ServiceBookingSchema);
