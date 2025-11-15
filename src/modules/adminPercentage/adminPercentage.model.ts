//@ts-ignore
import { model, Schema } from 'mongoose';
import { IAdminPercentage, IAdminPercentageModel } from './adminPercentage.interface';
import paginate from '../../common/plugins/paginate';


const adminPercentageSchema = new Schema<IAdminPercentage>(
  {
    percentage: {
      type: Number,
      required: [true, 'percentage is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

adminPercentageSchema.plugin(paginate);

adminPercentageSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
adminPercentageSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._AdminPercentageId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const AdminPercentage = model<
  IAdminPercentage,
  IAdminPercentageModel
>('AdminPercentage', adminPercentageSchema);
