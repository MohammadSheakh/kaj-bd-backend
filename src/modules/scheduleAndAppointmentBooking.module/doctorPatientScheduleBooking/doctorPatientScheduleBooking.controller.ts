import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { DoctorPatientScheduleBooking } from './doctorPatientScheduleBooking.model';
import { IDoctorPatientScheduleBooking } from './doctorPatientScheduleBooking.interface';
import { DoctorPatientScheduleBookingService } from './doctorPatientScheduleBooking.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../../token/token.interface';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';


export class DoctorPatientScheduleBookingController extends GenericController<
  typeof DoctorPatientScheduleBooking,
  IDoctorPatientScheduleBooking
> {
  doctorPatientScheduleBookingService = new DoctorPatientScheduleBookingService();

  constructor() {
    super(new DoctorPatientScheduleBookingService(), 'DoctorPatientScheduleBooking');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    //---------------------------------
    // here we also check if relation ship between doctor and patient exist or not
    // if not then we create the relationship 
    //---------------------------------

    const result = await this.doctorPatientScheduleBookingService.createV2(req.params.doctorScheduleId, req.user as IUser);

    sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: `${this.modelName} created successfully`,
    success: true,
    });
  });


  getAllUpcomingSchedule = catchAsync(async (req: Request, res: Response) => {
    const userTimeZone = req.header('X-Time-Zone') || 'Asia/Dhaka'; //TODO: Timezone must from env file

    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const result = await this.doctorPatientScheduleBookingService.getAllUpcomingSchedule(filters.doctorId, userTimeZone);
    
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All upcoming schedule of doctor`,
      success: true,
    });
  })

  // add more methods here if needed or override the existing ones 
}
