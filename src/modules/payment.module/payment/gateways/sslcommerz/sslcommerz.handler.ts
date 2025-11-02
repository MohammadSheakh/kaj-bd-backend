import ApiError from "../../../../../errors/ApiError";
import { ServiceBooking } from "../../../../service.module/serviceBooking/serviceBooking.model";
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { config } from "../../../../../config";
import { PaymentTransaction } from "../../../paymentTransaction/paymentTransaction.model";
import { TPaymentGateway } from "../../payment.constant";
import { TPaymentStatus } from "../../../paymentTransaction/paymentTransaction.constant";
import { TBookingStatus } from "../../../../service.module/serviceBooking/serviceBooking.constant";
import { PaymentTransactionService } from "../../../paymentTransaction/paymentTransaction.service";

// ===================================
// SSL COMMERZ SUCCESS HANDLER 
// 
//# you found rest of the ssl related handler in paymentTransaction.controller.ts
//
// validateAfterSuccessfulTransaction
// initiateARefundThroughAPI
// refundQuery
// queryTheStatusOfATransactionByTxnId
// queryTheStatusOfATransactionBySessionId
//
// ===================================

const paymentTransactionService = new PaymentTransactionService();

export const validateAfterSuccessfulTransaction = async (req: Request, res: Response) => {
    try {
        const sslData = req.body;
        
        console.log('SSL Success Data:', sslData);

        // Validate the transaction
        const isValidTransaction = await paymentTransactionService.validateSSLTransaction(sslData.val_id);
        
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
            paymentGateway: TPaymentGateway.sslcommerz, // TODO : MUST :
            transactionId: tran_id,
            paymentIntent: val_id,
            amount: parseFloat(amount),
            currency: 'BDT',
            paymentStatus: TPaymentStatus.completed, // import fix korte hobe .. option gula check dite hboe TODO : MUST :
            gatewayResponse: sslData,
        });

        // Update LabTestBooking
        await ServiceBooking.findByIdAndUpdate(referenceId, {
            $set: {
                status: TBookingStatus.completed, // finally we make this status completed .. 
                paymentStatus: TPaymentStatus.paid, // TODO : MUST : paid ekta option create korte hobe  
                paymentTransactionId: newPayment._id
            }
        });

        // TODO : MUST : Need to send notification to admin and provider about the money received ..

        // TODO : MUST : also add money to the Providers wallet .. 


        // ✅ Step 3: Handle mobile vs web client
        const userAgent = req.headers['user-agent']?.toLowerCase() || '';

        const isAndroid = userAgent.includes('android');
        const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ios');


        if (isAndroid || isIOS) {
            return res.status(StatusCodes.OK).json({
                message: 'Payment successful',
                data: {
                transactionId: tran_id,
                amount: data.amount,
                status: data.status,
                currency: data.currency,
                },
            });
        }

        // Redirect to success page
        res.redirect(`${config.frontend.url}/payment/success?booking_id=${referenceId}`);
        
    } catch (error) {
        console.error('SSL Success Handler Error:', error);
        res.redirect(`${config.frontend.url}/payment/failed`);
    }
};
