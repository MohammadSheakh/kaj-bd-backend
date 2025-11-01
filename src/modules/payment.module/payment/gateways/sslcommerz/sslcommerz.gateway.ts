import ApiError from "../../../../../errors/ApiError";
import { IServiceBooking } from "../../../../service.module/serviceBooking/serviceBooking.interface";
import { ServiceBooking } from "../../../../service.module/serviceBooking/serviceBooking.model";
import { IUser } from "../../../../token/token.interface";
import { PaymentGateway } from "../../payment.gateway";
import { StatusCodes } from 'http-status-codes';
import mongoose from "mongoose";
import SSLCommerzPayment from 'sslcommerz-lts';
import axios from 'axios';
import { User } from "../../../../user.module/user/user.model";
import { AdditionalCost } from "../../../../service.module/additionalCost/additionalCost.model";
import { IAdditionalCost } from "../../../../service.module/additionalCost/additionalCost.interface";
import { config } from "../../../../../config";
import { PaymentTransaction } from "../../../paymentTransaction/paymentTransaction.model";
import { TPaymentGateway } from "../../payment.constant";
import { TPaymentStatus } from "../../../paymentTransaction/paymentTransaction.constant";
import { TBookingStatus } from "../../../../service.module/serviceBooking/serviceBooking.constant";

// https://github.com/sslcommerz/SSLCommerz-NodeJS


export class SSLGateway implements PaymentGateway {

    /**
     * SSL COMMERZ - Service Booking Complete Payment
     * Flow:
     * 1. Create LabTestBooking [status.pending] [PaymentStatus.unpaid]
     * 2. Initialize SSL session and get payment URL
     * 3. User completes payment on SSL page
     * 4. SSL redirects to success/fail/cancel URL
     * 5. We validate transaction via IPN/validation API
     * 6. Create PaymentTransaction and update LabTestBooking
     */

    async processPayment(/*serviceBooking : IServiceBooking*/ data: any, user: IUser){
        const session = await mongoose.startSession();
    
        let finalAmount = 0;

        let isBookingExist : IServiceBooking | null;

        await session.withTransaction(async () => {
            const existingUser = await User.findById(user.userId);
            /*********
             * 📝🥇
             * 1. ++++++ We Create ServiceBooking [status.pending] [PaymentStatus.unpaid] [PaymentTransactionId = null] [PaymentGateway = null]
             * 2. ++ we Provide URL or something to payment .. 
             * -----------------------------------------------------------
             * 6. If Payment Successful .. its going to WEBHOOK 
             * 7. ++++ We create Payment Transaction .. referenceId should be that serviceBookingId, referenceFor should be "ServiceBooking"
             * 7. ++++ We update ServiceBooking [status.completed] [PaymentStatus.paid] [PaymentTransactionId = <transaction_id>] [PaymentGateway = "gateway name"]
             * 
             * ******* */

            isBookingExist = await ServiceBooking.findById(data._id).session(session);

            if(!isBookingExist){
                throw new ApiError(StatusCodes.NOT_FOUND, "Service Booking not found");
            }

            finalAmount = isBookingExist.startPrice;

            const additionalCosts : IAdditionalCost | null = await AdditionalCost.find({
            serviceBookingId : isBookingExist,
            isDeleted : false,
            }, { session }); 

            let totalAdditionalCost;

            if(additionalCosts){
                totalAdditionalCost = additionalCosts.reduce((sum, cost) => {
                    return sum + ( cost.price || 0 )
                })
            }


            finalAmount += totalAdditionalCost;

            isBookingExist.totalCost = finalAmount;

            // we dont need to create any booking here .. we can update totalCost
            await isBookingExist.save();

             
        });
        
        session.endSession();

        // SSL Commerz Payment Data
        const sslData = {
            total_amount: finalAmount,
            currency: 'BDT',
            tran_id: `SBooking_${isBookingExist._id}_${Date.now()}`, // Unique transaction ID
            success_url: `${config.sslcommerz.success_url}`,
            fail_url: `${config.sslcommerz.fail_url}`,
            cancel_url: `${config.sslcommerz.cancel_url}`,
            ipn_url: `${config.sslcommerz.ipn_url}`, // Important for validation
            
            // Product Information
            product_name: 'Service Booking',
            product_category: 'Healthcare',
            product_profile: 'general',
            
            // Customer Information
            cus_name: user?.userName,
            cus_email: user?.email,
            cus_add1: data.address || 'Dhaka',
            cus_city: data.city || 'Dhaka',
            cus_state: data.state || 'Dhaka',
            cus_postcode: data.zipCode || '1000',
            cus_country: 'Bangladesh',
            cus_phone: user?.phone || '01XXXXXXXXX',
            
            // Shipping Information (required by SSL)
            shipping_method: 'NO',
            num_of_item: 1,
            
            // Custom Fields for our reference (max 4 value fields)
            value_a: createdBooking._id.toString(), // referenceId
            value_b: TTransactionFor.LabTestBooking, // referenceFor
            value_c: user.userId.toString(), // userId
            value_d: finalAmount.toString(), // amount
        };

        const sslcz = new SSLCommerzPayment(
            // may be these value come from config file 
            config.sslcommerz.store_id, config.sslcommerz.store_passwd, config.sslcommerz.is_live);
        
        try {
            const apiResponse = await sslcz.init(sslData);
            
            if (apiResponse?.GatewayPageURL) {
                return {
                    url: apiResponse.GatewayPageURL,
                    bookingId: createdBooking._id,
                    transactionId: sslData.tran_id
                };
            } else {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'SSL Session initialization failed');
            }
        } catch (error) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Payment gateway error');
        }
    }
}


// metadata: {
//             /*****
//              * 📝 
//              * we receive these data in webhook ..
//              * based on this data .. we have to update our database in webhook ..
//              * also give user a response ..
//              * 
//              * now as our system has multiple feature that related to payment 
//              * so we provide all related data as object and stringify that ..
//              * also provide .. for which category these information we passing ..
//              * 
//              * like we have multiple usecase like
//              * 1. Product Order,
//              * 2. Lab Booking,
//              * 3. Doctor Appointment 
//              * 4. Specialist Workout Class Booking,
//              * 5. Training Program Buying .. 
//              *  
//              * **** */
//             referenceId: createdBooking._id.toString(), // in webhook .. in PaymentTransaction Table .. this should be referenceId
//             referenceFor: TTransactionFor.LabTestBooking, // in webhook .. this should be the referenceFor
//             currency: TCurrency.bdt,
//             amount: finalAmount.toString(),
//             user: JSON.stringify(user) // who created this order  // as we have to send notification also may be need to send email
            
//             /******
//              * 📝
//              * With this information .. first we create a 
//              * PaymentTransaction ..  where paymentStatus[Complete]
//              *  +++++++++++++++++++++ transactionId :: coming from Stripe
//              * ++++++++++++++++++++++ paymentIntent :: coming from stripe .. or we generate this 
//              * ++++++++++++++++++++++ gatewayResponse :: whatever coming from stripe .. we save those for further log
//              * 
//              * We also UPDATE Order Infomation .. 
//              * 
//              * status [ ]
//              * paymentTransactionId [🆔]
//              * paymentStatus [paid]
//              * 
//              * ******* */
//         },

