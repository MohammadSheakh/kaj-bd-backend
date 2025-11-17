//@ts-ignore
import { model, Schema } from 'mongoose';
import { IUserRoleData, IUserRoleDataModel } from './userRoleData.interface';
import paginate from '../../../common/plugins/paginate';
import { TAdminStatus, TProviderApprovalStatus } from './userRoleData.constant';

const UserRoleDataSchema = new Schema<IUserRoleData>(
  {
    userId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    adminStatus: {
      type: String,
      enum: [
        TAdminStatus.active, 
        TAdminStatus.inactive,
        // TAdminStatus.none // i dont this we need this
      ],
    },
    providerApprovalStatus: {
      type: String,
      enum: [
        TProviderApprovalStatus.accept,
        TProviderApprovalStatus.reject,
        TProviderApprovalStatus.pending,
        TProviderApprovalStatus.requested,
      ],
    },
    approvedAt: {
      type: Date,
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
