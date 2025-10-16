import { model, Schema } from 'mongoose';
import { IServiceCategory, IServiceCategoryModel } from './serviceCategory.interface';
import paginate from '../../../common/plugins/paginate';


const ServiceCategorySchema = new Schema<IServiceCategory>(
  {
    // userId: { //🔗
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    // },

    attachments: [
      {
        type: String, // store file URLs or paths
        required: false,
      },
    ],
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    createdBy: {
      type: String,
      enum: ['admin', 'user'],
      required: [true, 'createdBy is required'],
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

ServiceCategorySchema.plugin(paginate);

ServiceCategorySchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
ServiceCategorySchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._ServiceCategoryId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const ServiceCategory = model<
  IServiceCategory,
  IServiceCategoryModel
>('ServiceCategory', ServiceCategorySchema);
