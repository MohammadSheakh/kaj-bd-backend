import { model, Schema } from 'mongoose';
import { IAdditionalCost, IAdditionalCostModel } from './additionalCost.interface';
import paginate from '../../../common/plugins/paginate';


const AdditionalCostSchema = new Schema<IAdditionalCost>(
  {
    serviceBookingId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'ServiceBooking',
      required: [true, 'Service booking ID is required'],
    },
    costName: {
      type: String,
      required: [true, 'Cost name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    proofImage: [//🔗🖼️ currently our system has no scoop to upload this .. but we should keep this in mind
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'attachments is not required'],
      }
    ],
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

AdditionalCostSchema.plugin(paginate);

AdditionalCostSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
AdditionalCostSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._AdditionalCostId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const AdditionalCost = model<
  IAdditionalCost,
  IAdditionalCostModel
>('AdditionalCost', AdditionalCostSchema);
