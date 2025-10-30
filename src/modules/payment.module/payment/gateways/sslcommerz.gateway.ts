import ApiError from "../../../../errors/ApiError";
import { IServiceBooking } from "../../../service.module/serviceBooking/serviceBooking.interface";
import { ServiceBooking } from "../../../service.module/serviceBooking/serviceBooking.model";
import { IUser } from "../../../token/token.interface";
import { PaymentGateway } from "../payment.gateway";
import { StatusCodes } from 'http-status-codes';
import mongoose from "mongoose";
import SSLCommerzPayment from 'sslcommerz-lts';
import axios from 'axios';

export class SSLGateway implements PaymentGateway {

    /**
     * SSL COMMERZ - Lab Test Booking Payment
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
        let createdBooking = null;

        await session.withTransaction(async () => {
            const isBookingExist: IServiceBooking = await ServiceBooking.findById(data.labTestId).session(session);

            if (!isBookingExist) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found");
            }

            finalAmount = isBookingExist.startPrice; // let get all the extra price and sum that up

            /*****---------- we dont need this because we already have serviceBooking .. 
            const bookedService: ILabTestBooking = new LabTestBooking({
                patientId: user?.userId,
                labTestId: isLabTestExist._id,
                appointmentDate: data?.appointmentDate,
                startTime: data?.startTime,
                endTime: data?.endTime,
                address: data.address,
                city: data.city,
                state: data.state,
                zipCode: data.zipCode,
                country: data.country,
                paymentTransactionId: null,
                paymentStatus: PaymentStatus.unpaid,
                finalAmount: isLabTestExist.price
            });
        
            createdBooking = await bookedLabTest.save({ session });
            ****** */

            //--------------- what we can do here .. booking er total price set korte pari .. 
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
            sslConfig.store_id, sslConfig.store_passwd, sslConfig.is_live);
        
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


// ===================================
// SSL COMMERZ SUCCESS HANDLER
// ===================================

export const handleSSLSuccess = async (req: Request, res: Response) => {
    try {
        const sslData = req.body;
        
        console.log('SSL Success Data:', sslData);

        // Validate the transaction
        const isValidTransaction = await validateSSLTransaction(sslData.val_id);
        
        if (!isValidTransaction) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid transaction');
        }

        const {
            val_id, // Validation ID
            tran_id, // Transaction ID
            amount,
            card_type,
            store_amount,
            card_brand,
            bank_tran_id,
            status,
            value_a: referenceId, // bookingId
            value_b: referenceFor, // LabTestBooking
            value_c: userId,
        } = sslData;

        // Check if transaction status is VALID
        if (status !== 'VALID' && status !== 'VALIDATED') {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Payment not validated');
        }

        // Check if payment already processed
        const isPaymentExist = await PaymentTransaction.findOne({ transactionId: tran_id });
        
        if (isPaymentExist) {
            return res.redirect(`${config.frontend.url}/payment/success?already_processed=true`);
        }

        // Create Payment Transaction
        const newPayment = await PaymentTransaction.create({
            userId: userId,
            referenceFor,
            referenceId,
            paymentGateway: TPaymentGateway.sslcommerz,
            transactionId: tran_id,
            paymentIntent: val_id,
            amount: parseFloat(amount),
            currency: 'BDT',
            paymentStatus: TPaymentStatus.completed,
            gatewayResponse: sslData,
        });

        // Update LabTestBooking
        await LabTestBooking.findByIdAndUpdate(referenceId, {
            $set: {
                status: 'confirmed',
                paymentStatus: PaymentStatus.paid,
                paymentTransactionId: newPayment._id
            }
        });

        // Redirect to success page
        res.redirect(`${config.frontend.url}/payment/success?booking_id=${referenceId}`);
        
    } catch (error) {
        console.error('SSL Success Handler Error:', error);
        res.redirect(`${config.frontend.url}/payment/failed`);
    }
};
