//@ts-ignore
import { model, Schema } from 'mongoose';
import { ILocation, ILocationModel } from './location.interface';
import paginate from '../../../common/plugins/paginate';


const LocationSchema = new Schema<ILocation>(
  {
    address: {
        bn: {
            type: String,
            required: false,
        },
        en: {
            type: String,
            required: false,
        }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

LocationSchema.index({ location: '2dsphere' });

LocationSchema.plugin(paginate);

LocationSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
LocationSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._LocationId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const ProvidersLocation = model<
  ILocation,
  ILocationModel
>('Location', LocationSchema);
