//@ts-ignore
import { model, Schema } from 'mongoose';
import { IUserProvider, IUserProviderModel } from './userProvider.interface';
import paginate from '../../common/plugins/paginate';

const userProviderSchema = new Schema<IUserProvider>(
  {
    userId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    providerId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

userProviderSchema.plugin(paginate);

userProviderSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
userProviderSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._UserProviderId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const UserProvider = model<
  IUserProvider,
  IUserProviderModel
>('UserProvider', userProviderSchema);
