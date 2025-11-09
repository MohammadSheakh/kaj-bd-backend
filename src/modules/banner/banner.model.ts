//@ts-ignore
import { model, Schema } from 'mongoose';
import { IBanner, IBannerModel } from './banner.interface';
import paginate from '../../common/plugins/paginate';

const BannerSchema = new Schema<IBanner>(
  {
    attachments: 
    [//🔗🖼️
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

BannerSchema.plugin(paginate);

BannerSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
BannerSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._BannerId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const Banner = model<
  IBanner,
  IBannerModel
>('Banner', BannerSchema);
