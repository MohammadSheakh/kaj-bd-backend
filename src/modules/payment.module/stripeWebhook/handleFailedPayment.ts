//@ts-ignore
import mongoose from "mongoose";
import { TDoctorAppointmentScheduleStatus } from "../../scheduleAndAppointmentBooking.module/doctorAppointmentSchedule/doctorAppointmentSchedule.constant";
import { TUser } from "../../user/user.interface";
import { TTransactionFor } from "../paymentTransaction/paymentTransaction.constant";
//@ts-ignore
import Stripe from "stripe";
import { User } from "../../user/user.model";
import { IUser } from "../../token/token.interface";
import ApiError from "../../../errors/ApiError";
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

// async function handleFailedPayment(invoice) {
export const handleFailedPayment = async (session: Stripe.Checkout.Session | any) => {
  /******
   * invoice.payment_failed → Payment failure

    Stripe gives you:
    invoice.subscription, invoice.customer, invoice.next_payment_attempt, invoice.attempt_count

    👉 Update UserSubscription in DB:

    👉 status = "past_due" or "unpaid"
   * 
   * **** */
  try {

    const { referenceId, referenceFor, user, referenceId2, referenceFor2 } = session.metadata;
    
    let _user:IUser = JSON.parse(user);

    const thisCustomer = await User.findOne({ _id: _user.userId });

    if (!thisCustomer) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
    }

     let updatedObjectOfReferenceFor: any;
      if (referenceFor === TTransactionFor.Order) {
            // updatedObjectOfReferenceFor = updateOrderInformation(referenceId, newPayment._id);
      } 
      else if (referenceFor === TTransactionFor.DoctorPatientScheduleBooking) {
          console.log("👉 referenceFor === TTransactionFor.DoctorPatientScheduleBooking")
            updatedObjectOfReferenceFor = 
            updateDoctorPatientScheduleBooking(thisCustomer, referenceId2, referenceFor2);
      }

      if (!updatedObjectOfReferenceFor) {
            throw new ApiError(StatusCodes.NOT_FOUND, `In handlePaymentSucceeded Webhook Handler.. Booking not found 🚫 For '${referenceFor}': Id : ${referenceId}`);
      }
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

//---------------------------------
// const refModel = mongoose.model(result.type);
//  const isExistRefference = await refModel.findById(result.refferenceId).session(session);
//---------------------------------
async function updateDoctorPatientScheduleBooking(
    thisCustomer: TUser,
    doctorAppointmentScheduleId : string,
    doctorAppointmentScheduleIdReferenceFor: string
){

    let updatedDoctorPatientScheduleBooking = await 
      mongoose.model(doctorAppointmentScheduleIdReferenceFor).findByIdAndUpdate(
          doctorAppointmentScheduleId, 
          {
               /* update fields */
              scheduleStatus: TDoctorAppointmentScheduleStatus.available, // this is patientId
          },
          { new: true }
     );

     return updatedDoctorPatientScheduleBooking;
}

