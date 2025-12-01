import ApiError from "../../../../../errors/ApiError";
import { ServiceBooking } from "../../../../service.module/serviceBooking/serviceBooking.model";
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { config } from "../../../../../config";
import { TPaymentGateway } from "../../payment.constant";
import { PaymentMethod } from "../../../paymentTransaction/paymentTransaction.constant";
import { TBookingStatus, TPaymentStatus } from "../../../../service.module/serviceBooking/serviceBooking.constant";
import { PaymentTransactionService } from "../../../paymentTransaction/paymentTransaction.service";
import { Wallet } from "../../../../wallet.module/wallet/wallet.model";
import { IServiceBooking } from "../../../../service.module/serviceBooking/serviceBooking.interface";
import { TRole } from "../../../../../middlewares/roles";
import { TNotificationType } from "../../../../notification/notification.constants";
import { enqueueWebNotification } from "../../../../../services/notification.service";
import { PaymentTransaction } from "../../../paymentTransaction/paymentTransaction.model";
import { WalletTransactionHistory } from "../../../../wallet.module/walletTransactionHistory/walletTransactionHistory.model";
import { IWallet } from "../../../../wallet.module/wallet/wallet.interface";
import { TWalletTransactionHistory, TWalletTransactionStatus } from "../../../../wallet.module/walletTransactionHistory/walletTransactionHistory.constant";
import { TCurrency } from "../../../../../enums/payment";
import { TTransactionFor } from "../../../../../constants/TTransactionFor";
import { User } from "../../../../user.module/user/user.model";
import { IUser } from "../../../../user.module/user/user.interface";
import sendResponse from "../../../../../shared/sendResponse";

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

export const validateAfterSuccessfulTransaction = async (req: Request, res: Response) :Promise<any> => {
    try {
        const sslData = req.body;
        
        console.log('SSL Success Data:', sslData);

        // Validate the transaction
        const isValidTransaction = await paymentTransactionService.validateSSLTransaction(sslData.val_id);
        
        if (!isValidTransaction || !isValidTransaction.valid) {
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

        // Update Booking
        const updatedBooking :IServiceBooking =  await ServiceBooking.findByIdAndUpdate(referenceId, {
            $set: {
                status: TBookingStatus.completed, // finally we make this status completed .. 
                paymentStatus: TPaymentStatus.completed,  
                paymentTransactionId: newPayment._id,
                paymentMethod : PaymentMethod.online,
            }
        });

        let startPrice :number = parseInt(updatedBooking?.startPrice); // TODO : MUST : Fix korte hobe 
        
        let adminsPercentOfStartPrice:number = parseFloat(updatedBooking?.adminPercentageOfStartPrice); // we need to add this money to admin's wallet

        let finalAmountToAddProvidersWallet : number = parseFloat(amount) - parseFloat(adminsPercentOfStartPrice);

        const wallet : IWallet = await Wallet.findOne({ userId:updatedBooking.providerId });
        const balanceBeforeTransaction = wallet.amount;
        const balanceAfterTransaction = wallet.amount + finalAmountToAddProvidersWallet;


        // add money to Admins wallet ----------------------------------------
        const admin:IUser = await User.findOne({ role: TRole.admin });

        const adminWallet : IWallet = await Wallet.findOne({ userId : admin._id });
        const balanceBeforeTransactionForAdmin = adminWallet.amount;
        const balanceAfterTransactionForAdmin = adminWallet.amount + adminsPercentOfStartPrice;

        const updatedAdminWallet :IWallet = await Wallet.findOneAndUpdate(
            { userId:admin._id },
            { $inc: { 
                    amount: parseFloat(adminsPercentOfStartPrice),
                    totalBalance: parseFloat(adminsPercentOfStartPrice) // we actually dont need to add this 
                } 
            },
            { new: true }
        );

        // also create wallet transaction history for admin
        await WalletTransactionHistory.create(
            {
                walletId:updatedAdminWallet._id,
                paymentTransactionId: newPayment._id,
                type : TWalletTransactionHistory.credit,
                amount : parseFloat(adminsPercentOfStartPrice),
                currency : TCurrency.bdt,
                status : TWalletTransactionStatus.completed,
                referenceFor : TTransactionFor.ServiceBooking,
                referenceId : updatedBooking._id,
                balanceBefore: balanceBeforeTransactionForAdmin,
                balanceAfter: balanceAfterTransactionForAdmin
            },
        );


        // add money to the Providers wallet .. ------------------------------------------
        const updatedWallet :IWallet = await Wallet.findOneAndUpdate(
            { userId:updatedBooking.providerId },
            { $inc: { 
                    amount: parseFloat(finalAmountToAddProvidersWallet),
                    totalBalance: parseFloat(amount)
                } 
            },
            { new: true }
        );

        // also create wallet transaction history for provider
        await WalletTransactionHistory.create(
            { 
                walletId:updatedWallet._id,
                paymentTransactionId: newPayment._id,
                type : TWalletTransactionHistory.credit,
                amount : parseFloat(finalAmountToAddProvidersWallet),
                currency : TCurrency.bdt,
                status : TWalletTransactionStatus.completed,
                referenceFor : TTransactionFor.ServiceBooking,
                referenceId : updatedBooking._id,
                balanceBefore: balanceBeforeTransaction,
                balanceAfter: balanceAfterTransaction
            },
        );

        // Send notification to admin and provider about the money received ..
        await enqueueWebNotification(
            `BDT ${amount} is added to your wallet for Booking ${referenceId} TnxId : ${newPayment._id}`,
            updatedBooking.userId, // senderId
            updatedBooking.providerId, // receiverId
            TRole.provider, // receiverRole
            TNotificationType.serviceBooking, // type
            updatedBooking._id, // idOfType
            null, // linkFor
            null // linkId
        );

        await enqueueWebNotification(
            `BDT ${amount} is added to ${updatedBooking.providerId} wallet for Booking ${referenceId} TnxId : ${newPayment._id}`,
            updatedBooking.userId, // senderId
            null, // receiverId
            TRole.admin, // receiverRole
            TNotificationType.payment, // type
            updatedBooking._id, // idOfType
            null, // linkFor
            null // linkId
        );

        // ✅ Step 3: Handle mobile vs web client
        const userAgent = req.headers['user-agent']?.toLowerCase() || '';

        const isAndroid = userAgent.includes('android');
        const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ios');


        // if (isAndroid || isIOS) {
        //     return sendResponse(res, {
        //     code: StatusCodes.OK,
        //     data: {
        //         message: 'Payment successful',
        //         data: {
        //         transactionId: tran_id,
        //         // amount: data.amount,
        //         // status: data.status,
        //         // currency: data.currency,
        //         },
        //     },
        //     message: `Payment successful`,
        // });
        // }

        

        // Redirect to success page
        // res.redirect(`${config.frontend.url}/payment/success?booking_id=${referenceId}`);
        
        //------------ This is for SSL Commerze success page
        // res.redirect(`http://localhost:6737/`); -- as we are in ubuntu

        res.redirect(config.backend.shobhoyUrl);
        
        
    } catch (error) {
        console.error('SSL Success Handler Error:', error);
        res.redirect(`${config.frontend.url}/payment/failed`);
    }
};
