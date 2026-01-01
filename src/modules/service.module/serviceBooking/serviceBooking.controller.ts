//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceBooking } from './serviceBooking.model';
import { ICreateServiceBooking, IServiceBooking } from './serviceBooking.interface';
import { ServiceBookingService } from './serviceBooking.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../../token/token.interface';
import ApiError from '../../../errors/ApiError';
import { defaultExcludes } from '../../../constants/queryOptions';
import { AdditionalCost } from '../additionalCost/additionalCost.model';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { PaymentTransactionService } from '../../payment.module/paymentTransaction/paymentTransaction.service';
import { PaymentTransaction } from '../../payment.module/paymentTransaction/paymentTransaction.model';
import { TTransactionFor } from '../../../constants/TTransactionFor';
import { enqueueWebNotification } from '../../../services/notification.service';
import { TBookingStatus, TPaymentStatus } from './serviceBooking.constant';
import { TRole } from '../../../middlewares/roles';
import { TNotificationType } from '../../notification/notification.constants';
import { SSLGateway } from '../../payment.module/payment/gateways/sslcommerz/sslcommerz.gateway';
import { Review } from '../review/review.model';
import { IReview } from '../review/review.interface';
import { User } from '../../user.module/user/user.model';
import { IAdditionalCost } from '../additionalCost/additionalCost.interface';
import { PaymentMethod, TPaymentGateway } from '../../payment.module/paymentTransaction/paymentTransaction.constant';
import { IWallet } from '../../wallet.module/wallet/wallet.interface';
import { Wallet } from '../../wallet.module/wallet/wallet.model';
import { WalletTransactionHistory } from '../../wallet.module/walletTransactionHistory/walletTransactionHistory.model';
import { TWalletTransactionHistory, TWalletTransactionStatus } from '../../wallet.module/walletTransactionHistory/walletTransactionHistory.constant';
import { TCurrency } from '../../../enums/payment';
//@ts-ignore
import mongoose from 'mongoose';

export class ServiceBookingController extends GenericController<
  typeof ServiceBooking,
  IServiceBooking
> {
  serviceBookingService = new ServiceBookingService();
  paymentTransactionService = new PaymentTransactionService();
  sslGateway = new SSLGateway();

  constructor() {
    super(new ServiceBookingService(), 'ServiceBooking');
  }

  getBookingDetailsWithUserDetails = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const result = await ServiceBooking.findById(id)
      .select('startPrice address bookingDateTime status')
      .populate([
        {
          path: 'userId',
          select: 'phoneNumber name profileImage role', //🆕phoneNumber  // name profileImage role
          populate: { path: 'profileId', select: 'gender location' }
        }
      ]);


    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });

  getAllWithPaginationV2 = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt -__v';

    options.limit = 3000;

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  getAllWithPaginationV2ForAdmin = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt -__v';

    

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const userTimeZone = req.header('X-Time-Zone') || 'Asia/Dhaka'; //TODO: Timezone must from env file
    const data = req.body as ICreateServiceBooking;

    const result = await this.serviceBookingService.createV3(data, req.user as IUser, userTimeZone);

    sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: `${this.modelName} created successfully`,
    success: true,
    });
  });

  checkForOverlapScheduleBeforeCreate = catchAsync(async (req: Request, res: Response) => {
    const userTimeZone = req.header('X-Time-Zone') || 'Asia/Dhaka'; //TODO: Timezone must from env file
    const data = req.body as ICreateServiceBooking; // we only receive bookingDateTime and providerId here

    const result = await this.serviceBookingService.checkForOverlapScheduleBeforeCreate(data, req.user as IUser, userTimeZone);

    sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: `Schedule checked successfully`,
    success: true,
    });
  });

  
  getAllBookingsWhichStatusIsDone = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const result = await this.serviceBookingService.getAllCompletedBookings(
      req.user.userId, 
      filters,
      options
    );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  })

  /** ----------------------------------------------
   * @role 
   * @Section 
   * @module |
   * @figmaIndex 0-0
   * @todo we need to move all logic to service 
   * @desc we need to override this method .. because .. we need 
   * functionality like sending in app notification
   * and push notification targeted user about the 
   * bookings current status  
   * 
   * THIS UPDATE BY ID ONLY WORK FOR PROVIDER AND USER
   * 
   *----------------------------------------------*/
  updateById = catchAsync(async (req: Request, res: Response) => {
    const loggedInUser = req.user as IUser;

    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `id is required for update ${this.modelName}`
      );
    }
    
    const id = req.params.id;


    const updatedObject:IServiceBooking = await ServiceBooking.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).populate([
      { path: 'providerId userId', select: 'name' },
      { path: 'providerDetailsId', select: 'serviceName' },
    ]);

    // console.log("req.body -> ", req.body);
    // console.log("req.params -> ", req.params);
    // console.log("updatedObject -> ", updatedObject);


    if (!updatedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }


    //------------------------------------------------------------------
    // Lets send booking related notification to recpective user
    // user can be provider or user .. also we send notification to admin also ..  
    //------------------------------------------------------------------

    let receiverId = null;
    let senderId = null;
    let receiverRole = null;

    if(loggedInUser.role === TRole.provider){
      senderId = updatedObject.providerId._id;
      receiverId = updatedObject.userId._id;
      receiverRole  = TRole.provider;
    }else{
      senderId = updatedObject.userId._id;
      receiverId = updatedObject.providerId._id;
      receiverRole  = TRole.user;
    }

    if(req.body.status === updatedObject.status){
      if(req.body.status === TBookingStatus.accepted){
        // provider
        await enqueueWebNotification(
          `Booking ${updatedObject._id} is accepted by provider.`, // by ${updatedObject.userId.name}
          senderId, // senderId
          receiverId, // receiverId
          receiverRole, // receiverRole
          TNotificationType.serviceBooking, // type
          updatedObject._id, // idOfType
          null, // linkFor
          null // linkId
        );
        
      }else if(req.body.status === TBookingStatus.cancelled){
        
        if(loggedInUser.role === TRole.provider){
          // cancel by provider

          await enqueueWebNotification(
            `Booking ${updatedObject._id} is cancelled by provider`, // ${updatedObject.userId.name}
            senderId, // senderId
            receiverId, // receiverId
            receiverRole, // receiverRole
            TNotificationType.serviceBooking, // type
            updatedObject._id, // idOfType
            null, // linkFor
            null // linkId
          );
        }else{

          // cancel by user
          await enqueueWebNotification(
            `Booking ${updatedObject._id} is cancelled by user `, // ${updatedObject.userId.name}
            senderId, // senderId
            receiverId, // receiverId
            receiverRole, // receiverRole
            TNotificationType.serviceBooking, // type
            updatedObject._id, // idOfType
            null, // linkFor
            null // linkId
          );
        }


      }else if(req.body.status === TBookingStatus.inProgress){
        // provider
        await enqueueWebNotification(
          `The provider has started working on your booking ${updatedObject._id}.`, // ${updatedObject.userId.name}
          senderId, // senderId
          receiverId, // receiverId
          receiverRole, // receiverRole
          TNotificationType.serviceBooking, // type
          updatedObject._id, // idOfType
          null, // linkFor
          null // linkId
        );
        
      }else if(req.body.status === TBookingStatus.paymentRequest){
        // provider

        await enqueueWebNotification(
          /*${updatedObject.providerId.userName}*/`Provider requested for payment for Booking ${updatedObject._id}`,
          senderId, // senderId
          receiverId, // receiverId
          receiverRole, // receiverRole
          TNotificationType.serviceBooking, // type
          updatedObject._id, // idOfType
          null, // linkFor
          null // linkId
        );
        
      }else if(req.body.status === TBookingStatus.completed){
        // provider // incomplete ... 
        // 🟢 need to send notification to admin and provider both 
        await enqueueWebNotification(
          `Booking ${updatedObject._id} is marked as completed.`, // ${updatedObject.userId.name}
          senderId, // senderId
          receiverId, // receiverId
          receiverRole, // receiverRole
          TNotificationType.serviceBooking, // type
          updatedObject._id, // idOfType
          null, // linkFor
          null // linkId
        );


        
        // //---------------------------------  This code is from suplify
        // // Now send notification to admin that patient has purchased training program
        // //---------------------------------
        // await enqueueWebNotification(
        //   `${updatedTrainingProgramPurchase.trainingProgramId} Training Program of specialist ${updatedTrainingProgramPurchase.specialistId} purchased by user ${user.userName}. purchaseTrainingProgramId ${updatedTrainingProgramPurchase._id}`,
        //   senderId, // senderId
        //   null, // receiverId // as admin has no specific receiverId
        //   TRole.admin, // receiverRole
        //   TNotificationType.serviceBooking, // type
        //   null, // linkFor
        //   null // linkId
        // );


      }
      // else if(req.body.status === TBookingStatus.cancelled){
      //   // cancel by user
      //   sendNotificationToUser();
      // }
      else{
        console.log("🚩🚩❌");
      }

    }

      //   return res.status(StatusCodes.OK).json(updatedObject);
      sendResponse(res, {
        code: StatusCodes.OK,
        data: updatedObject,
        message: `${this.modelName} updated successfully`,
      });
  });


  makePayment = catchAsync(async (req: Request, res: Response) => {
    const loggedInUser = (req.user as IUser);

    // here id is serviceBookingId

    // processPayment is makePayment 
    const result = await this.sslGateway.processPayment(req.params.id, loggedInUser);
  
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} updated successfully`,
    });
  })

  // front-end app will call this after successful payment with
  // serviceBookingId, tran_id
  paymentSuccessful= catchAsync(async(req: Request, res: Response) => {

    const loggedInUser = req.user;
    const serviceBookingId = req.query.serviceBookingId;
    const tran_id = req.query.transactionId;
    
    
    const session = await mongoose.startSession();
    
        let finalAmount = 0;

        let isBookingExist : IServiceBooking | null;
        let existingUser: IUser | null;

        await session.withTransaction(async () => {
            existingUser = await User.findById(loggedInUser.userId);
            
            isBookingExist = await ServiceBooking.findById(serviceBookingId).session(session);

            console.log('isBookingExist :: ', isBookingExist);

            if(!isBookingExist){
                throw new ApiError(StatusCodes.NOT_FOUND, "Service Booking not found");
            }

            finalAmount = isBookingExist.startPrice;
            
            console.log('finalAmount :: ', finalAmount);

            const additionalCosts : IAdditionalCost[] | null = await AdditionalCost.find({
                serviceBookingId : isBookingExist,
                isDeleted : false,
            }).session(session);

            console.log('additionalCosts :: ', additionalCosts);

            let totalAdditionalCost;

            if(additionalCosts.length > 0){
                totalAdditionalCost = additionalCosts.reduce((sum, cost) => {
                    return sum + ( cost.price || 0 )
                }, 0)

                console.log('totalAdditionalCost :: ', totalAdditionalCost);

                finalAmount += totalAdditionalCost;
            }

            console.log('finalAmount :: ', finalAmount);

            isBookingExist.totalCost = finalAmount;

            // we dont need to create any booking here .. we can update totalCost
            await isBookingExist.save();

        });
        
      session.endSession();


      //-------------------------------------------------
      //-------------------------------------------------


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
          amount: parseFloat(finalAmount), //amount
          currency: 'BDT',
          paymentStatus: TPaymentStatus.completed, // import fix korte hobe .. option gula check dite hboe TODO : MUST :
          gatewayResponse: null, //sslData,
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
          userId:updatedBooking.providerId,
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

    return finalAmount;
  })

  getTotalPriceToPay =  catchAsync(async (req: Request, res: Response) => {
    const loggedInUser = (req.user as IUser);

    // here id is serviceBookingId

    // processPayment is makePayment 
    const result = await this.serviceBookingService.getTotalPriceToPay(req.params.id, loggedInUser);
  
    sendResponse(res, {
      code: StatusCodes.OK,
      data: null,
      message: `${this.modelName} updated successfully`,
    });
  })

  getWithAdditionalCosts = catchAsync(async (req: Request, res: Response) => {
    const loggedInUser = (req.user as IUser);
    // const result = await this.service.getWithAdditionalCosts(req.params.id, loggedInUser);

    const serviceBooking = await ServiceBooking.findById(req.params.id).select(defaultExcludes).populate([
      {
      path: 'providerId',
      select: 'name profileImage'
      },
      {
      path: 'attachments',
      select: 'attachment attachmentType'
      },]
    ); // its booking id
    const additionalCosts = await AdditionalCost.find({
      serviceBookingId: req.params.id
    }).select(defaultExcludes);

    let review: IReview | null = null;

    // if provider then show review
    if(loggedInUser.role == TRole.provider){
      review = await Review.findOne({
        serviceBookingId: req.params.id
      }).select(defaultExcludes).populate({
        path: 'userId',
        select: 'name profileImage'
      })
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        serviceBooking,
        additionalCosts,
        review
      },
      message: `${this.modelName} updated successfully`,
    });
  })

  getWithAdditionalCostsForAdmin = catchAsync(async (req: Request, res: Response) => {
    const loggedInUser = (req.user as IUser);
    // const result = await this.service.getWithAdditionalCosts(req.params.id, loggedInUser);

    const serviceBooking = await ServiceBooking.findById(req.params.id).select(defaultExcludes).populate([
        {
          path: 'userId',
          select: 'name profileImage role'
        },  
        {
          path: 'providerId',
          select: 'name profileImage role'
        },
        {
          path: 'attachments',
          select: 'attachment attachmentType'
        },
      ]
    ); // its booking id
    const additionalCosts = await AdditionalCost.find({
      serviceBookingId: req.params.id
    }).select(defaultExcludes);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        serviceBooking,
        additionalCosts,
      },
      message: `${this.modelName} updated successfully`,
    });
  })

  // add more methods here if needed or override the existing ones 
}
