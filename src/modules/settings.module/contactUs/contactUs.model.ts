//@ts-ignore
import { model, Schema } from 'mongoose';
import { IContactUs, IContactUsModel } from './contactUs.interface';
import paginate from '../../../common/plugins/paginate';


const ContactUsSchema = new Schema<IContactUs>(
  {
    email: {
      type: String,
      required: [true, 'email is required'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    detailsOverview: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

ContactUsSchema.plugin(paginate);

ContactUsSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
ContactUsSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._ContactUsId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const ContactUs = model<
  IContactUs,
  IContactUsModel
>('ContactUs', ContactUsSchema);
