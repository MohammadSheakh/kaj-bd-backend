//@ts-ignore
import { model, Schema } from 'mongoose';
import { IServiceBooking, IServiceBookingModel } from './serviceBooking.interface';
import paginate from '../../../common/plugins/paginate';
import { TBookingStatus, TPaymentStatus } from './serviceBooking.constant';
import { PaymentMethod } from '../../payment.module/paymentTransaction/paymentTransaction.constant';

//--------------------------
// this serviceBooking 
// has other parts price .. which
// comes from additionalCost schema . 
//--------------------------
const ServiceBookingSchema = new Schema<IServiceBooking>(
  {
    userId: { //🔗 who book this service /// 🧲 it shows User ID is required but we provide this
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    providerId: { //🔗 who provide this service
      type: Schema.Types.ObjectId,
      ref: 'User', //ServiceProvider
      required: [true, 'Provider ID is required'],
    },
    providerDetailsId: { //🔗 details of service provider
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider', //Service Provider Details
      required: [true, 'Provider ID is required'],
    },
    bookingDateTime: { // dont provide Z at the end .. We need UTC Time to Save Database
      type: Date,
      required: [true, 'Booking date is required'],
    },
    expectedEndDate: {
      type: Date,
      required: [false, 'Expected end date is not required'],
    },
    // completionDate is actual End Date .. 
    completionDate: { // dont provide Z at the end .. We need UTC Time to Save Database
      type: Date,
    },
    // bookingTime: { // need to think about this 
    //   type: String,
    //   required: [true, 'Booking time is required'],
    // },
    bookingMonth: {
      type: String,
      required: [false, 'Booking month is not required'],
    },
    status: {
      type: String,
      enum: [
        TBookingStatus.pending, // get all requested booked service [status = pending]
        TBookingStatus.accepted, 
        TBookingStatus.inProgress,
        TBookingStatus.cancelled,
        TBookingStatus.paymentRequest,
        TBookingStatus.completed
      ],
      default: TBookingStatus.pending,
    },
    address: {
      // type: String,
      // required: [true, 'Address is required'],
      en: {
        type: String, // 🧲 it shows it is required .. but we provide this
        required: [true, 'English address is required'],
        trim: true,
      },
      bn: {
        type: String, // 🧲 it shows it is required .. but we provide this
        required: [true, 'Bangla address is required'],
        trim: true,
      },
    },
    lat: {
      type: String,
      required: [true, 'Latitude is required'],
    },
    long: {
      type: String,
      required: [true, 'Longitude is required'],
    },
    duration: {
      type: String,
      required: [false, 'Duration is required'],
    },
    attachments: [//🔗🖼️
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'attachments is not required'],
      }
    ],
    startPrice: {
      type: Number,
      required: [true, 'Start price is required'], // 🧲 serious issue .. Start price is required .. but i provide that  
      min: 0,
    },
    // otherPartsPrice: { // need to think about this
    //   type: Number,
    //   default: 0,
    // },
    totalCost: { // need to think about this 
      type: Number,
      required: [false, 'Total cost is not required'],
      min: 0,
    },

    adminPercentageOfStartPrice: { // required true or false .. need to think 
      type: Number,
      required: [false, 'Admin percentage is not required'],
      min: 0,
    },

    //--------------------
    paymentTransactionId: { //🔗 Same as PaymentId of kappes
      type: Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: PaymentMethod,
      required: [false, `paymentMethod is required .. it can be  ${Object.values(PaymentMethod).join(
        ', '
      )}`],
      // default: PaymentMethod.online,
    },
    paymentStatus : {
      type: String,
      enum: [
        TPaymentStatus.unpaid,
        TPaymentStatus.paid,
        TPaymentStatus.refunded,
        TPaymentStatus.failed,
        TPaymentStatus.completed
      ],
      default: TPaymentStatus.unpaid,
      required: [true, `paymentStatus is required .. it can be  ${Object.values(TPaymentStatus).join(
        ', '
      )}`],
    },

    hasReview: {
      type: Boolean,
      required: [false, 'hasReview is not required'],
      default: false,
    },

    //--------------------
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

ServiceBookingSchema.plugin(paginate);

ServiceBookingSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
ServiceBookingSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._ServiceBookingId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const ServiceBooking = model<
  IServiceBooking,
  IServiceBookingModel
>('ServiceBooking', ServiceBookingSchema);
