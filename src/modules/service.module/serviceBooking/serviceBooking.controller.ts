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

export class ServiceBookingController extends GenericController<
  typeof ServiceBooking,
  IServiceBooking
> {
  serviceBookingService = new ServiceBookingService();

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


  getById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const populateOptions = [
      // 'providerId',
      // {
      //   path: 'profileId',
      //   select: '-attachments -__v', // TODO MUST : when create profile .. must initiate address and description
      //   // populate: {
      //   //   path: 'profileId',
      //   // }
      // },
      // {
      //   path: 'providerId',
      //   select: 'name profileImage',
      // }
    ];
    
    const select =  "startPrice address bookingDateTime status";
    //defaultExcludes

    const result = await this.service.getById(id, populateOptions, select);

    // get all cost for this booking 
    const additionalCost = await AdditionalCost.find({
      serviceBookingId: id
    })

    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: { 
        result, 
        additionalCost
      },
      message: `${this.modelName} retrieved successfully`,
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

  // add more methods here if needed or override the existing ones 
}
