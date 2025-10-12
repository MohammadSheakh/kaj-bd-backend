import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { SpecialistPatient } from './specialistPatient.model';
import { ISpecialistPatient } from './specialistPatient.interface';
import { SpecialistPatientService } from './specialistPatient.service';
import catchAsync from '../../../shared/catchAsync';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';


export class SpecialistPatientController extends GenericController<
  typeof SpecialistPatient,
  ISpecialistPatient
> {
  specialistPatientService = new SpecialistPatientService();

  constructor() {
    super(new SpecialistPatientService(), 'specialistPatient');
  }

  //---------------------------------
  // Specialist | Members And Protocol | Show all patient and their doctors, subscriptionPlan
  //---------------------------------

  showAllPatientsAndTheirDoctors = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const result = await this.specialistPatientService.showAllPatientsAndTheirDoctors(req.user.userId,
        filters,
        options
      );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });



  //---------------------------------
  // Doctor | Protocol Section | Assign Specialist for a patient
  // Admin | User Management | Assign Specialist for a patient
  //---------------------------------
  create = catchAsync(async (req: Request, res: Response) => {
    const data :ISpecialistPatient = req.body;

    // check if already assigned
    const existing = await SpecialistPatient.findOne({
      patientId: data.patientId,
      specialistId: data.specialistId
    }).lean();

    if(existing) {
      sendResponse(res, {
        code: StatusCodes.OK,
        data: existing,
        message: `Specialist already assigned to this patient`,
        success: true,
      });
    }

    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  //---------------------------------
  // Doctor | Protocol Section | Show all Specialist for assign to a patient
  //---------------------------------
  showAllSpecialist = catchAsync(async (req: Request, res: Response) => {
    //---------------------------------
    // TODO : get all specialist .. who are approved .. and not connected with this patient  
    //---------------------------------

    const result = await this.specialistPatientService.
    getUnknownSpecialistsForPatientForAssign(req.params.patientId,
      [], // filters
      [] // options
    )

    // const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `Unknown Specialist for patient retrieved successfully`,
      success: true,
    });
  });

  

  //---------------------------------
  // Patient | Get all Patients Specialist .. 
  //---------------------------------
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'specialistId',
        select: 'name profileImage profileId',
        populate: {
          path: 'profileId', // deep populate attachments
          select: 'description howManyPrograms protocolNames' // only pick attachmentName
        }
      },
      // ''
    ];

   const select = '-isDeleted -createdAt -updatedAt -__v'; 

    const result = await this.service.getAllWithPagination(filters, options, populateOptions, select);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

//--------------------------------- 
// Patient | Get all Unknown Specialist .. 
//---------------------------------
  getUnknownSpecialist = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    // const { page, limit } = PaginationHelpers.extractPaginationFromQuery(req.query);
    
    // 📈⚙️ OPTIMIZATION:
    const result = await this.specialistPatientService.getUnknownSpecialistsForPatient(req.user.userId,
      // {
      //   page: options.page,
      //   limit: options.limit
      // }
      filters,
      options
    );

    // data: {
    //     doctors: result.results,
    //     pagination: result.pagination
    //   }
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
