import { model, Schema } from 'mongoose';
import { IUserDevices, IUserDevicesModel } from './UserDevices.interface';
import paginate from '../../common/plugins/paginate';


const UserDevicesSchema = new Schema<IUserDevices>(
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

UserDevicesSchema.plugin(paginate);

UserDevicesSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
UserDevicesSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._UserDevicesId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const UserDevices = model<
  IUserDevices,
  IUserDevicesModel
>('UserDevices', UserDevicesSchema);
