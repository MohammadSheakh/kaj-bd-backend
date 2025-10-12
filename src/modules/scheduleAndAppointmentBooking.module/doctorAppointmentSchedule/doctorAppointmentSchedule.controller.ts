//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { DoctorAppointmentSchedule } from './doctorAppointmentSchedule.model';
import { IDoctorAppointmentSchedule } from './doctorAppointmentSchedule.interface';
import { DoctorAppointmentScheduleService } from './doctorAppointmentSchedule.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../../token/token.interface';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { TRole } from '../../../middlewares/roles';
import { toLocalTime } from '../../../utils/timezone';


export class DoctorAppointmentScheduleController extends GenericController<
  typeof DoctorAppointmentSchedule,
  IDoctorAppointmentSchedule
> {
  doctorAppointmentScheduleService = new DoctorAppointmentScheduleService();

  constructor() {
    super(new DoctorAppointmentScheduleService(), 'DoctorAppointmentSchedule');
  }

  //---------------------------------
  // Doctor | Create Doctor Appointment Schedule 
  //---------------------------------
  create = catchAsync(async (req: Request, res: Response) => {
    const userTimeZone = req.header('X-Time-Zone') || 'Asia/Dhaka'; //TODO: Timezone must from env file

    const data: IDoctorAppointmentSchedule = req.body;

    data.createdBy = (req.user as IUser)?.userId;

    const result = await this.doctorAppointmentScheduleService.createV2(data, userTimeZone);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  //TODO : need to add caching .. 
  /****
   * 
   * Doctor  | Schedule | get all schedule .. (query -> scheduleStatus[available])
   * ******* */
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    const userTimeZone = req.header('X-Time-Zone') || 'Asia/Dhaka'; //TODO: Timezone must from env file
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    /***
     * 
     * if logged in user role is doctor .. then return for only his schedules... 
     * ***/
    if(req.user && (req.user as IUser)?.role === TRole.doctor){
      filters.createdBy = (req.user as IUser)?.userId; 
    }
    
    const populateOptions: (string | {path: string, select: string}[]) = [
    ];

    // const select = ''; 

    const result : IPaginateResult = await this.service.getAllWithPagination(filters, options, populateOptions/*, select*/);

    // Convert startTime/endTime for each item in results
    const convertedResults = result.results.map(item => ({
      ...item.toObject(), // or spread if already plain object
      startTime: toLocalTime(item.startTime, userTimeZone),
      endTime: toLocalTime(item.endTime, userTimeZone),
    }));

    result.results = convertedResults;

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  /********⚙️
   * 
   * Patient | Get A Doctors All Appointment Schedule 
   * 📝 here we want to show last 3 booked schedule .. two [completed] one [scheduled]
   * and all schedule of doctor which are [available]
   * ***** */
  getAllAvailableScheduleAndRecentBookedScheduleOfDoctor = catchAsync(async (req: Request, res: Response) => {
    const userTimeZone = req.header('X-Time-Zone') || 'Asia/Dhaka'; //TODO: Timezone must from env file
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    if(!req.user || (req.user as IUser)?.role !== TRole.patient) {
      throw new Error('Only patients can access this route');
    }

    const patientId = (req.user as IUser)?.userId;

    if(!filters.createdBy){
      throw new Error('Doctor ID in createdBy is required to fetch schedules');
    }
    
    const populateOptions: (string | {path: string, select: string}[]) = [
    ];

    // const select = ''; 

    const result : IPaginateResult = await this.doctorAppointmentScheduleService.getAllAvailableScheduleAndRecentBookedScheduleOfDoctor(filters, options, populateOptions, patientId/*, select*/);

    //--- Convert startTime/endTime for each item in results
    const convertedResults = result.results.map(item => ({
      ...item,//.toObject(), // or spread if already plain object // TODO : MUST check this response .. 
      startTime: toLocalTime(item.startTime, userTimeZone),
      endTime: toLocalTime(item.endTime, userTimeZone),
    }));

    //@ts-ignore
    result.results = convertedResults;

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}

interface IPaginateResult {
  results: IDoctorAppointmentSchedule[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}