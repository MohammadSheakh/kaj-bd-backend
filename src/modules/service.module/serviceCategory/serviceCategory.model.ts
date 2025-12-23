import { model, Schema } from 'mongoose';
import { IServiceCategory, IServiceCategoryModel } from './serviceCategory.interface';
import paginate from '../../../common/plugins/paginate';
import { TRole } from '../../../middlewares/roles';

const ServiceCategorySchema = new Schema<IServiceCategory>(
  {
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'attachments is not required'],
      }
    ],
    name: {
      en: {
        type: String,
        required: [true, 'English name is required'],
        trim: true
      },
      bn: {
        type: String,
        required: [true, 'Bangla name is required'],
        trim: true
      }
    },
    // name: {
    //   type: String,
    //   required: [true, 'name is required'],
    //   trim: true,
    // },
    createdBy: {
      type: String,
      enum: [TRole.admin, TRole.provider, TRole.subAdmin],
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
