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

export class ServiceBookingController extends GenericController<
  typeof ServiceBooking,
  IServiceBooking
> {
  serviceBookingService = new ServiceBookingService();
  paymentTransactionService = new PaymentTransactionService();

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

    const updatedObject:IServiceBooking = await this.service.updateById(id, req.body);
    if (!updatedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }

    let receiverId = null;
    let senderId = null;
    let receiverRole = null;

    if(loggedInUser.role === TRole.provider){
      senderId = updatedObject.providerId;
      receiverId = updatedObject.userId;
      receiverRole  = TRole.provider;
    }else{
      senderId = updatedObject.userId;
      receiverId = updatedObject.providerId;
      receiverRole  = TRole.user;
    }


    //---------------------------------
     // Lets send notification to specialist that patient has purchased training program
     //---------------------------------
     await enqueueWebNotification(
          `TrainingProgram ${trainingProgramId} purchased by a patient ${user.userName}`,
          senderId, // senderId
          receiverId, // receiverId
          receiverRole, // receiverRole
          TNotificationType.serviceBooking, // type
          'trainingProgramId', // linkFor
          trainingProgramId // linkId
     );


     if(updatedObject.status === TBookingStatus.completed){
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

    

      //   return res.status(StatusCodes.OK).json(updatedObject);
      sendResponse(res, {
        code: StatusCodes.OK,
        data: updatedObject,
        message: `${this.modelName} updated successfully`,
      });
  });

  // add more methods here if needed or override the existing ones 
}
