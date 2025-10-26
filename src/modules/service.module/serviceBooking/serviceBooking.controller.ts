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

  // add more methods here if needed or override the existing ones 
}
