//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import {  UserService } from './user.service';
import { User } from './user.model';
import { GenericController } from '../../_generic-module/generic.controller';
//@ts-ignore
import { Request, Response } from 'express';
import { IUser } from '../../token/token.interface';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { UserProfile } from '../userProfile/userProfile.model';

const userService = new UserService();

// TODO : IUser should be import from user.interface
export class UserController extends GenericController<
  typeof User,
  IUser
> {
  userService = new UserService();

  constructor() {
    super(new UserService(), 'User');
  }

//---------------------------------
// from previous codebase
//---------------------------------
  createAdminOrSuperAdmin = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await this.userService.createAdminOrSuperAdmin(payload);
    sendResponse(res, {
      code: StatusCodes.CREATED,
      data: result,
      message: `${
        payload.role === 'admin' ? 'Admin' : 'Super Admin'
      } created successfully`,
    });
  });

//---------------------------------
// Specialist | Get Profile Information as logged in user 
//---------------------------------
  getById = catchAsync(async (req: Request, res: Response) => {
    const id = (req.user as IUser).userId;

    // TODO : ⚠️ need to optimize this populate options ..
    const populateOptions = [
      'profileId',
      {
        path: 'profileId',
        select: '-attachments -__v', // TODO MUST : when create profile .. must initiate address and description
        // populate: {
        //   path: 'profileId',
        // }
      }
    ];

    const select = 'name profileImage';

    const result = await this.service.getById(id, populateOptions, select);

    // if (!result) {
    //   throw new ApiError(
    //     StatusCodes.NOT_FOUND,
    //     `Object with ID ${id} not found`
    //   );
    // }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });


//---------------------------------
// Admin | Get Profile Information by Id  to approve doctor / specialist 
//---------------------------------
  getByIdForAdmin = catchAsync(async (req: Request, res: Response) => {
    const id = (req.user as IUser).userId;

    // TODO : ⚠️ need to optimize this populate options ..
    const populateOptions = [
      'profileId',
      {
        path: 'profileId',
        select: '-attachments -__v', // TODO MUST : when create profile .. must initiate address and description
        // populate: {
        //   path: 'profileId',
        // }
      }
    ];
    
    const select = 'name profileImage';

    const result = await this.service.getById(id, populateOptions, select);

    // if (!result) {
    //   throw new ApiError(
    //     StatusCodes.NOT_FOUND,
    //     `Object with ID ${id} not found`
    //   );
    // }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });

//---------------------------------
// Admin | User Management With Statistics 💎✨🔍 V2 Found
//---------------------------------
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'profileId',
        select: 'approvalStatus attachments',
        populate: {
          path: 'attachments',
          select: 'attachment attachmentType'
        }
      }
    ];

    const query = {};

    // Create a copy of filter without isPreview to handle separately
    const mainFilter = { ...filters };

    // Loop through each filter field and add conditions if they exist
    for (const key of Object.keys(mainFilter)) {
      if (key === 'name' && mainFilter[key] !== '') {
        query[key] = { $regex: mainFilter[key], $options: 'i' }; // Case-insensitive regex search for name
      // } else {
      } else if (mainFilter[key] !== '' && mainFilter[key] !== null && mainFilter[key] !== undefined){
        
        //---------------------------------
        // In pagination in filters when we pass empty string  it retuns all data
        //---------------------------------
        query[key] = mainFilter[key];
      }
    }

    const select = 'name email role profileImage subscriptionType'; 

    const result = await this.service.getAllWithPagination(query, options, populateOptions , select);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  getAllWithPaginationV2 = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    // Pass approvalStatus filter separately for profile filtering
    // const profileFilter = req.query.approvalStatus ? { approvalStatus: req.query.approvalStatus } : {};

    const query = {};

    // Create a copy of filter without isPreview to handle separately
    const mainFilter = { ...filters };

    // Loop through each filter field and add conditions if they exist
    for (const key of Object.keys(mainFilter)) {
      if (key === 'name' && mainFilter[key] !== '') {
        query[key] = { $regex: mainFilter[key], $options: 'i' }; // Case-insensitive regex search for name
      // } else {
      } else if (mainFilter[key] !== '' && mainFilter[key] !== null && mainFilter[key] !== undefined){
        
        //---------------------------------
        // In pagination in filters when we pass empty string  it retuns all data
        //---------------------------------
        query[key] = mainFilter[key];
      }
    }

    const select = 'name email role subscriptionType'; 

    // const result = await this.service.getAllWithPagination(query, options, populateOptions , select );

    const result = await this.userService.getAllWithAggregation(query, options/*, profileFilter*/);


    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  //---------------------------------
  // Admin | Change Approval Status of Doctor / Specialist by UserId
  //---------------------------------
  changeApprovalStatusByUserId = catchAsync(async (req: Request, res: Response) => {
    // const userId = req.params.id;
    const { approvalStatus, userId } = req.query;

    const result = await this.userService.changeApprovalStatusByUserId(userId, String(approvalStatus));

    sendResponse(res, {
      code: StatusCodes.OK,
      success: true,
      message: 'Approval status updated successfully',
      data: result,
    });
  })


 
    
    



}


