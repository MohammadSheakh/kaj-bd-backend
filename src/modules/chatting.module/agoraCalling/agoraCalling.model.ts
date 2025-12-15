//@ts-ignore
import { model, Schema } from 'mongoose';
import { IAgoraCalling, IAgoraCallingModel } from './agoraCalling.interface';
import paginate from '../../../common/plugins/paginate';

const AgoraCallingSchema = new Schema<IAgoraCalling>(
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

AgoraCallingSchema.plugin(paginate);

AgoraCallingSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
AgoraCallingSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._AgoraCallingId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const AgoraCalling = model<
  IAgoraCalling,
  IAgoraCallingModel
>('AgoraCalling', AgoraCallingSchema);
