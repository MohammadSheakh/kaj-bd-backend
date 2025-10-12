//@ts-ignore
import { model, Schema } from 'mongoose';
import { IDoctorAppointmentSchedule, IDoctorAppointmentScheduleModel } from './doctorAppointmentSchedule.interface';
import paginate from '../../../common/plugins/paginate';
import { TDoctorAppointmentScheduleStatus, TMeetingLink } from './doctorAppointmentSchedule.constant';


const DoctorAppointmentScheduleSchema = new Schema<IDoctorAppointmentSchedule>(
  {
    createdBy: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
    booked_by : { //🔗👤 when a patient booked this schedule .. his Id should be here .. 
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [false, 'booked_by is not required'],
      default: null,
    },
    scheduleName: {
      type: String,
      required: [true, 'scheduleName is required'],
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

    timeLeft: { // ℹ️
      type: Number,
      required: [false, 'timeLeft is not required, This is just for show value'],
    },
    minutesLeft: { // ℹ️
      type: Number,
      required: [false, 'minutesLeft is not required, This is just for show value'],
    },
    description : {
      type: String,
      required: [true, 'description is required'],
    },
    scheduleStatus: {
      type: String,
      enum: [
        TDoctorAppointmentScheduleStatus.available,
        TDoctorAppointmentScheduleStatus.booked,
        TDoctorAppointmentScheduleStatus.cancelled,
      ],
      default: TDoctorAppointmentScheduleStatus.available,
      required: [true, `scheduleStatus is required .. it can be  ${Object.values(TDoctorAppointmentScheduleStatus).join(
                ', '
              )}`],
    },
    price : {
      type: Number,
      required: [true, 'price is required'],
    },
    typeOfLink: {
      type: String,
      enum: [
        TMeetingLink.zoom,
        TMeetingLink.googleMeet,
        TMeetingLink.others
      ],
      required: [true, `typeOfLink is required .. it can be  ${Object.values(TMeetingLink).join(
                ', '
              )}`],
    },
    meetingLink:{
      type : String,
      required: [true, 'meetingLink is required'],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

DoctorAppointmentScheduleSchema.plugin(paginate);

DoctorAppointmentScheduleSchema.pre('save', function (next: any) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
DoctorAppointmentScheduleSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._DoctorAppointmentScheduleId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const DoctorAppointmentSchedule = model<
  IDoctorAppointmentSchedule,
  IDoctorAppointmentScheduleModel
>('DoctorAppointmentSchedule', DoctorAppointmentScheduleSchema);
