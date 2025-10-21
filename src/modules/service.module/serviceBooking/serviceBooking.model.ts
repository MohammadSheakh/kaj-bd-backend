//@ts-ignore
import { model, Schema } from 'mongoose';
import { IServiceBooking, IServiceBookingModel } from './serviceBooking.interface';
import paginate from '../../../common/plugins/paginate';
import { TBookingStatus } from './serviceBooking.constant';

//--------------------------
// this serviceBooking 
// has other parts price .. which
// comes from additionalCost schema . 
//--------------------------
const ServiceBookingSchema = new Schema<IServiceBooking>(
  {
    userId: { //🔗 who book this service
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    providerId: { //🔗 who provide this service
      type: Schema.Types.ObjectId,
      ref: 'User', //ServiceProvider
      required: [true, 'Provider ID is required'],
    },
    bookingDate: { // dont provide Z at the end .. We need UTC Time to Save Database
      type: Date,
      required: [true, 'Booking date is required'],
    },
    completionDate: { // dont provide Z at the end .. We need UTC Time to Save Database
      type: Date,
    },
    bookingTime: { // need to think about this 
      type: String,
      required: [true, 'Booking time is required'],
    },
    bookingMonth: {
      type: String,
      required: [true, 'Booking month is required'],
    },
    status: {
      type: String,
      enum: [ 
        TBookingStatus.pending ,
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
        type: String,
        required: [true, 'English address is required'],
        trim: true,
      },
      bn: {
        type: String,
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
      required: [true, 'Duration is required'],
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
      required: [true, 'Start price is required'],
      min: 0,
    },
    // otherPartsPrice: { // need to think about this
    //   type: Number,
    //   default: 0,
    // },
    totalCost: { // need to think about this 
      type: Number,
      required: [true, 'Total cost is required'],
      min: 0,
    },
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
