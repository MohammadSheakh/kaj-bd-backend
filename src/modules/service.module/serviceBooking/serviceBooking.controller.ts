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
import { TBookingStatus } from './serviceBooking.constant';
import { TRole } from '../../../middlewares/roles';
import { TNotificationType } from '../../notification/notification.constants';
import { SSLGateway } from '../../payment.module/payment/gateways/sslcommerz/sslcommerz.gateway';
import { Review } from '../review/review.model';
import { IReview } from '../review/review.interface';

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

    console.log("req.body -> ", req.body);
    console.log("req.params -> ", req.params);
    console.log("updatedObject -> ", updatedObject);


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
          `Booking ${updatedObject._id} is accepted by ${updatedObject.userId.name}`,
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
            `Booking ${updatedObject._id} is cancelled by provider ${updatedObject.userId.name}`,
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
            `Booking ${updatedObject._id} is cancelled by user ${updatedObject.userId.name}`,
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
          `Booking ${updatedObject._id} status in progress by provider ${updatedObject.userId.name}`,
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
          `${updatedObject.providerId.userName} requested for payment for Booking ${updatedObject._id}`,
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
          `Booking ${updatedObject._id} status in progress by provider ${updatedObject.userId.name}`,
          senderId, // senderId
          receiverId, // receiverId
          receiverRole, // receiverRole
          TNotificationType.serviceBooking, // type
          updatedObject._id, // idOfType
          null, // linkFor
          null // linkId
        );


        //---------------------------------
        // Now send notification to admin that patient has purchased training program
        //---------------------------------
        await enqueueWebNotification(
          `${updatedTrainingProgramPurchase.trainingProgramId} Training Program of specialist ${updatedTrainingProgramPurchase.specialistId} purchased by user ${user.userName}. purchaseTrainingProgramId ${updatedTrainingProgramPurchase._id}`,
          senderId, // senderId
          null, // receiverId // as admin has no specific receiverId
          TRole.admin, // receiverRole
          TNotificationType.serviceBooking, // type
          null, // linkFor
          null // linkId
        );


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
      select: 'attachment'
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

  // add more methods here if needed or override the existing ones 
}
