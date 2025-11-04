//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceProvider } from './serviceProvider.model';
import { ICreateServiceProvider, ICreateServiceProviderDTO, IServiceProvider, IUpdateProfileDTO } from './serviceProvider.interface';
import { ServiceProviderService } from './serviceProvider.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../../token/token.interface';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';
import { UserProfile } from '../../user.module/userProfile/userProfile.model';
import { UserRoleData } from '../../user.module/userRoleData/userRoleData.model';
import { TProviderApprovalStatus } from '../../user.module/userRoleData/userRoleData.constant';
import { User } from '../../user.module/user/user.model';
import { defaultExcludes } from '../../../constants/queryOptions';
import ApiError from '../../../errors/ApiError';
import { Review } from '../review/review.model';

//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
export class ServiceProviderController extends GenericController<
  typeof ServiceProvider,
  IServiceProvider
> {
  serviceProviderService = new ServiceProviderService();

  constructor() {
    super(new ServiceProviderService(), 'ServiceProvider');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateServiceProvider = req.body;

    // 🥇
    // Translate multiple properties dynamically
    const [nameObj] : [IServiceProvider['serviceName']]  = await Promise.all([
      buildTranslatedField(data.serviceName as string)
    ]);

    /*------------------- We move all these code to function for DRY Principal
    const cleanText = data.name.trim();
    if (cleanText.length < 3) {
      // too short → use user.language
    }

    // 🔍 Detect actual language of the review text
    let detectedLang = detectLanguage(data.name);
    const originalLang = detectedLang || 'en'; // fallback

    // Fallback: if unknown, use user's profile language
    if (detectedLang === 'unknown') {
      const user = await User.findById(req.user.userId);
      detectedLang = user?.language || 'en';
    }

    const nameObj = {
      en: '',
      bn: ''
    };


    // 3. Set original
    nameObj[originalLang] = cleanText; // which is detected lang

    // 4. Translate to the other language
    const otherLang = originalLang === 'en' ? 'bn' : 'en';
    nameObj[otherLang] = await translateTextToTargetLang(
      data.name,
      otherLang
    );

    // 5. Save to DB
    const newReview = new ServiceCategory({
      name: nameObj,
      createdBy : "admin", // TODO : 
      createdByUserId : req.body.userId,
    });
    
    await newReview.save();
    ---------------------------------*/

    const createServiceProvider : ICreateServiceProviderDTO = {
      serviceCategoryId : data.serviceCategoryId,
      serviceName : nameObj,
      yearsOfExperience : data.yearsOfExperience,
      startPrice : data.startPrice,
      providerId : (req.user as IUser).userId,
    }

    const updatedServiceProvidersProfile : IUpdateProfileDTO= {
      backSideCertificateImage :  req.body.backSideCertificateImage,
      frontSideCertificateImage : req.body.frontSideCertificateImage
    }

    const [result, updatedProfile, updateServiceProviderRoleData] = await Promise.all([
       this.service.create(createServiceProvider as Partial<IServiceProvider>),
       
       UserProfile.findOneAndUpdate(
        { userId: (req.user as IUser).userId },
        updatedServiceProvidersProfile,
        { new: true }
      ),
      
      UserRoleData.findOneAndUpdate(
        { userId: (req.user as IUser).userId },
        {
          providerApprovalStatus : TProviderApprovalStatus.pending
        },
        { new: true }
      )
    ])

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  getProfileDetails = catchAsync(async(req: Request, res: Response) => {
    const id = req.params.id;

    const result : IServiceProvider = await ServiceProvider
    .findById(id).select(defaultExcludes).populate({
      path: 'serviceCategoryId',
      select: 'name'
    }).lean();
  
    const [ userProfileInfo, userInfo ] = await Promise.all([
      
      UserProfile.findOne({
        userId: result.providerId
      }).select('gender dob location').lean(),

      User.findById(result.providerId).select('name phoneNumber profileImage').lean()
    ])

    const resp = {
      ...result,
      ...userProfileInfo,
      ...userInfo
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: resp,
      message: `Profile Details retrieved successfully`,
      success: true,
    });
  })

  getByIdWithReviews = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    // INFO: is it possible to optimize this more ?
    const populateOptions = [
      // 'providerId',
      // {
      //   path: 'profileId',
      //   select: '-attachments -__v', // TODO MUST : when create profile .. must initiate address and description
      //   // populate: {
      //   //   path: 'profileId',
      //   // }
      // },
      {
        path: 'providerId',
        select: 'name profileImage',
      }
    ];
    
    const select =  defaultExcludes;

    const result = await this.service.getById(id, populateOptions, select);

    const reviews = await Review.find({ serviceProviderDetailsId: id }); // TODO : MUST : 
    
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
        reviews
      },
      message: `${this.modelName} retrieved successfully`,
    });
  });

  getServiceProviderDetailsAndNIDImagesFromUserProfile = catchAsync(async (req: Request, res: Response) => {
    const response = await this.serviceProviderService.detailsAndNIDImagesFromUserProfile((req.user as IUser).userId as string);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: response,
      message: `${this.modelName} retrieved successfully`,
    });
  })

  // add more methods here if needed or override the existing ones 
}
