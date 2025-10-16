import { model, Schema } from 'mongoose';
import { IUserRoleData, IUserRoleDataModel } from './UserRoleData.interface';
import paginate from '../../common/plugins/paginate';


const UserRoleDataSchema = new Schema<IUserRoleData>(
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

UserRoleDataSchema.plugin(paginate);

UserRoleDataSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
UserRoleDataSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._UserRoleDataId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const UserRoleData = model<
  IUserRoleData,
  IUserRoleDataModel
>('UserRoleData', UserRoleDataSchema);
