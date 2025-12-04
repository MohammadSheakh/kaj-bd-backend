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
import { TokenService } from '../../token/token.service';
import { AuthService } from '../../auth/auth.service';
import ApiError from '../../../errors/ApiError';
import { TRole } from '../../../middlewares/roles';

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


  /** ---------------------------------------------- kaj Bd
   * @role Admin
   * @Section Settings
   * @module |
   * @figmaIndex 08-01
   * @desc Get Profile Information as logged in user
   *----------------------------------------------*/
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

    const select = 'name profileImage email phoneNumber';

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


  // send Invitation Link for a admin
  sendInvitationLinkToAdminEmail = catchAsync(async (req:Request, res:Response) => {

    const user = await User.findOne({ email : req.body.email });

    /**
     *
     * req.body.email er email jodi already taken
     * if ----
     * then we check isEmailVerified .. if false .. we make that true
     *
     * if isDeleted true then we make it false
     *
     * else ---
     *  we create new admin and send email
     *
     */

    if (user && user.isEmailVerified === false) { // previously isEmailVerified was true
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
    } else if (user && user.isDeleted === true) {
      user.isDeleted = false;
      await user.save();
    } else if (user && user.isEmailVerified === false) {
      user.isEmailVerified = true;
      await user.save();
      const token = await TokenService.createVerifyEmailToken(user);
      
    } else {
      // create new user
      if (req.body.role == TRole.subAdmin) {

        console.log("⚡ Hit because req.body.role = TRole.subAdmin");

        const response = await this.userService.createAdminOrSuperAdmin({
          email: req.body.email,
          password: req.body.password,
          role: req.body.role,
          name: req.body.name,
          phoneNumber: req.body.phoneNumber,
        });

        sendResponse(res, {
          code: StatusCodes.OK,
          data: response,
          message: `New admin created and invitation link sent successfully`,
        });
      }
    }
  });

  removeSubAdmin = catchAsync(async (req:Request, res:Response) => {

    const response = await this.userService.removeSubAdmin(req.params.id);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: response,
      message: `Account removed successfully`,
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


  //---------------------------------
  // 🥇 This Is for User Pagination
  //---------------------------------
  getAllWithPaginationV2 = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const result = await this.userService.getAllWithAggregation(filters, options);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  //---------------------------------
  // 🥇 This Is for User Pagination
  //---------------------------------
  getAllWithPaginationV2WithStatistics = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
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

    const select = 'name email phoneNumber createdAt'; 

    const result = await this.userService.getAllWithAggregationWithStatistics(query, options, req.user.userId/*, profileFilter*/);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // TODO : MUST : Get all providers who are not approved ..  

  //---------------------------------
  // 📈⚙️ This Is for Provider Pagination
  //---------------------------------
  getAllWithPaginationV3 = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    /*-------------------------- We done this part in service ..  using matchStage

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

    */

    const result = await this.userService.getAllWithAggregationV2(filters, /*query,*/ options/*, profileFilter*/);

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

  //--------------------------------- kaj bd
  // User | Home Page | 03-01 | get category and popular providers also banners 
  //---------------------------------
  getCategoriesAndPopularProvidersForUser = catchAsync(async (req: Request, res: Response) => {
    const result = await this.userService.getCategoriesAndPopularProvidersForUser();
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Categories and popular providers fetched successfully',
      success: true,
    });
  })

  getPopularProvidersForUser = catchAsync(async (req: Request, res: Response) => {
    const result = await this.userService.getPopularProvidersForUser();
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Categories and popular providers fetched successfully',
      success: true,
    });
  })

  //--------------------------------- kaj bd
  // User | Home Page | 03-01 | get category and popular providers also banners 
  //---------------------------------
  getEarningAndCategoricallyBookingCountAndRecentJobRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await this.userService.getEarningAndCategoricallyBookingCountAndRecentJobRequest(req.user.userId, req.query.type);
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Categories and popular providers fetched successfully',
      success: true,
    });
  })
 
  //--------------------------------- kaj bd
  // User | Profile | 06-01 | get profile information of a user 
  //---------------------------------
  getProfileInformationOfAUser = catchAsync(async (req: Request, res: Response) => {
    
    const result = await this.userService.getProfileInformationOfAUser(req.user as IUser);
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Profile information fetched successfully',
      success: true,
    });
  })
  

  updateProfileInformationOfAUser = catchAsync(async (req: Request, res: Response) => {
    
    // await UserProfile.updateMany(
    //   { "locationV2.coordinates": { $size: 0 } },
    //   { $set: { locationV2: { type: "Point", coordinates: [0, 0] } } }
    // );

    const result = await this.userService.updateProfileInformationOfAUser((req.user as IUser).userId  as string, req.body);
    
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Profile information fetched successfully',
      success: true,
    });
  })

  updateLocationTest  = catchAsync(async (req: Request, res: Response) => {
    
    // await UserProfile.updateMany(
    //   { "locationV2.coordinates": { $size: 0 } },
    //   { $set: { locationV2: { type: "Point", coordinates: [0, 0] } } }
    // );

    await UserProfile.updateMany(
      { "locationV2.coordinates": { $size: 0 } },
      { $unset: { locationV2: "" } }
    )

    
    sendResponse(res, {
      code: StatusCodes.OK,
      data: null,
      message: 'done',
      success: true,
    });
  })

  updateProfileInformationOfAdmin = catchAsync(async (req: Request, res: Response) => {
    
    req.body.profileImage = req.uploadedFiles.profileImage; // it actually returns array of string

    const data = req.body;
    
    const result = await this.userService.updateProfileInformationOfAdmin((req.user as IUser).userId  as string, data);
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Profile information fetched successfully',
      success: true,
    });
  })

  updateProfileImageSeparately = catchAsync(async (req: Request, res: Response) => {
    const id = req.user.userId;
    req.body.profileImage = req.uploadedFiles.profileImage; // it actually returns array of string

    console.log("req.uploadedFiles.profileImage -> ", req.uploadedFiles.profileImage);
    console.log("req.body from controller -> ", req.body);
    console.log("req.body.profileImage from controller -> ", req.body.profileImage);

    const data = req.body;

    const result = await this.userService.updateProfileImageSeperately(id, data);
    
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} updated successfully`,
      success: true,
    });
    
  });
  
}


