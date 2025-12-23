//@ts-ignore
import { model, Schema } from 'mongoose';
import { IReview, IReviewModel } from './review.interface';
import paginate from '../../../common/plugins/paginate';
import { TLanguage } from '../../../enums/language';
//----------------------------------
// Since reviews are user-generated content, you typically don’t translate them 
// automatically (because the reviewer wrote in their own language).  
//---------------------------------
const ReviewSchema = new Schema<IReview>(
  {
    review: {
      en: { 
        type: String, 
        required: [true, 'English review is required'], 
        trim: true 
      },
      bn: {
        type: String, 
        required: [true, 'Bangla review is required'], 
        trim: true 
      }
    },
    originalLanguage: { //
      type: String,
      enum: [TLanguage.en, TLanguage.bn],
      required: true,
      // e.g., 'bn' if user wrote in Bangla
    },
    rating: {
      type: Number,
      required: [true, 'rating is required'],
      min: 0,
      max: 5,
    },
    userId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    serviceProviderDetailsId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider',
      required: [true, 'serviceProviderDetailsId is required'],
    },
    serviceBookingId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'ServiceBooking',
      required: [true, 'serviceBookingId is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);
/*
const ReviewSchema = new Schema<IReview>(
  {
    review: {
      type: String,
      required: [true, 'review is required'],
    },
    rating: {
      type: Number,
      required: [true, 'rating is required'],
      min: 0,
      max: 5,
    },
    userId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    serviceProviderId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User', // reference ki ServiceProvider hobe naki User hobe .. chinta korte hobe 
      required: [true, 'serviceProviderId is required'],
    },
    serviceBookingId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'ServiceBooking',
      required: [true, 'serviceBookingId is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);
*/

ReviewSchema.plugin(paginate);

ReviewSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
ReviewSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._ReviewId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const Review = model<
  IReview,
  IReviewModel
>('Review', ReviewSchema);


