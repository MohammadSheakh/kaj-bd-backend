import { model, Schema } from 'mongoose';
import { IDoctorPatientScheduleBooking, IDoctorPatientScheduleBookingModel } from './doctorPatientScheduleBooking.interface';
import paginate from '../../../common/plugins/paginate';
import { TAppointmentStatus } from './doctorPatientScheduleBooking.constant';
import { PaymentMethod } from '../../order.module/order/order.constant';
import { TPaymentStatus } from '../specialistPatientScheduleBooking/specialistPatientScheduleBooking.constant';


const DoctorPatientScheduleBookingSchema = new Schema<IDoctorPatientScheduleBooking>(
  {
    patientId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'patientId is required'],
    },
    doctorScheduleId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'DoctorAppointmentSchedule',
      required: [true, 'doctorScheduleId is required'],
    },
    doctorId: { //🔗 🔥🔥🔥 will provides significant performance and functionality benefits
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'doctorId is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
    status: {
      type : String,
      enum: [
        TAppointmentStatus.pending,
        TAppointmentStatus.scheduled,
        TAppointmentStatus.completed,
        TAppointmentStatus.cancelled
      ],
      // default: TAppointmentStatus.pending,
      required: [true, `status is required .. it can be  ${Object.values(TAppointmentStatus).join(
              ', '
            )}`],
    },
    price : {
      type: Number,
      required: [true, 'price is required'],
    },
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
        TPaymentStatus.failed
      ],
      default: TPaymentStatus.unpaid,
      required: [true, `paymentStatus is required .. it can be  ${Object.values(TPaymentStatus).join(
              ', '
            )}`],
    },
    scheduleDate: {
      type: Date,
      required: [true, 'scheduleDate is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'startTime is required . type is Date'],
    },
    endTime: {
      type: Date,
      required: [true, 'endTime is required . type is Date'],
    },
  },
  { timestamps: true }
);

DoctorPatientScheduleBookingSchema.plugin(paginate);

DoctorPatientScheduleBookingSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
DoctorPatientScheduleBookingSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._DoctorPatientScheduleBookingId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const DoctorPatientScheduleBooking = model<
  IDoctorPatientScheduleBooking,
  IDoctorPatientScheduleBookingModel
>('DoctorPatientScheduleBooking', DoctorPatientScheduleBookingSchema);
