//@ts-ignore
import { model, Schema } from 'mongoose';
import { ISupportMessage, ISupportMessageModel } from './supportMessage.interface';
import paginate from '../../common/plugins/paginate';

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    creatorId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    supportMessage: {
      type: String,
      required: [true, 'supportMessage is required'],
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'attachments is not required'],
      }
    ],
    isResolved: {
      type: Boolean,
      required: [false, 'isResolved is not required'],
      default : false,
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

SupportMessageSchema.plugin(paginate);

SupportMessageSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
SupportMessageSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._SupportMessageId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const SupportMessage = model<
  ISupportMessage,
  ISupportMessageModel
>('SupportMessage', SupportMessageSchema);
