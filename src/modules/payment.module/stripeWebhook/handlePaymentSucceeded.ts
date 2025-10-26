import ApiError from "../../../errors/ApiError";
import { TRole } from "../../../middlewares/roles";
import { enqueueWebNotification } from "../../../services/notification.service";
import { TNotificationType } from "../../notification/notification.constants";
import { IUser } from "../../token/token.interface";
import { User } from "../../user.module/user/user.model";
import { WalletService } from "../../wallet.module/wallet/wallet.service";
import { TPaymentGateway, TPaymentStatus, TTransactionFor } from "../paymentTransaction/paymentTransaction.constant";
import { PaymentTransaction } from "../paymentTransaction/paymentTransaction.model";
//@ts-ignore
import Stripe from "stripe";
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
//@ts-ignore
import mongoose from "mongoose";


const walletService = new WalletService();

// Function for handling a successful payment
export const handlePaymentSucceeded = async (session: Stripe.Checkout.Session) => {
     
     try {

          console.log("session.metadata 🔎🔎", session.metadata)

          const { 
               referenceId, // bookingId
               user,
               referenceFor, // TTransactionFor .. bookingId related to which model
               currency,
               amount,
               referenceId2, // if more data is needed
               referenceFor2, // if more data is needed .. referenceId2 related to which model
               ...rest  // 👈 This captures everything else
          }: any = session.metadata;
          // userId // for sending notification .. 

          let _user:IUser = JSON.parse(user);

          const thisCustomer = await User.findOne({ _id: _user.userId });

          if (!thisCustomer) {
               throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
          }

          // TODO : 🟢🟢
          // Based on referenceId and referenceFor .. we need to check
          // that Id exist or not in our database .. 

          const paymentIntent = session.payment_intent as string;
          console.log('=============================');
          console.log('paymentIntent : ', paymentIntent);
          
          const isPaymentExist = await PaymentTransaction.findOne({ paymentIntent });

          if (isPaymentExist) {
               throw new ApiError(StatusCodes.BAD_REQUEST, 'From Webhook handler : Payment Already exist');
          }

          if(referenceFor === TTransactionFor.UserSubscription){

               // which means we dont create paymentTransaction here ..
               // we want to create  paymentTransaction in handleSuccessfulPayment
               console.log("🟡🟡 which means we dont create paymentTransaction here 🟡🟡 we want to create  paymentTransaction in handleSuccessfulPayment")
               // lets test ... 
               return
          }
          
          const newPayment = await PaymentTransaction.create({
               userId: _user.userId,
               referenceFor, // If this is for Order .. we pass "Order" here
               referenceId, // If this is for Order .. then we pass OrderId here
               paymentGateway: TPaymentGateway.stripe,
               transactionId: session.id,
               paymentIntent: paymentIntent,
               amount: amount,
               currency,
               paymentStatus: TPaymentStatus.completed,
               gatewayResponse: session,
          });

          let updatedObjectOfReferenceFor: any;
          if (referenceFor === TTransactionFor.Order) {
               // updatedObjectOfReferenceFor = 
               // updateOrderInformation(
               //      _user,
               //      referenceId, // orderId
               //      newPayment._id, 
               //      referenceId2, // cartId
               //      referenceFor2 // Cart
               // );
          }else{
               console.log(`🔎🔎🔎🔎🔎 May be we need to handle this  ${referenceFor} :: ${referenceId}`)
          }

          // if (!updatedObjectOfReferenceFor) {
          //      throw new ApiError(StatusCodes.NOT_FOUND, `In handlePaymentSucceeded Webhook Handler.. Booking not found 🚫 For '${referenceFor}': Id : ${referenceId}`);
          // }

          //---------------------------------
          // Notification Send korte hobe .. TODO :
          //---------------------------------

          return { payment: newPayment, paymentFor: updatedObjectOfReferenceFor };
     } catch (error) {
          console.error('Error in handlePaymentSucceeded:', error);
     }
};

//---------------------------------
// 🥇
//  const refModel = mongoose.model(result.type);
//  const isExistRefference = await refModel.findById(result.refferenceId).session(session);
//---------------------------------
