//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceProvider } from './serviceProvider.model';
import { ICreateServiceProvider, ICreateServiceProviderDTO, IServiceProvider, IUpdateProfileDTO, IUploadAttachmentsForGalleryDTO, IUploadAttachmentsForGalleryDTOV2 } from './serviceProvider.interface';
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
//@ts-ignore
import mongoose from 'mongoose';
import { ICreateServiceCategory, IServiceCategory } from '../serviceCategory/serviceCategory.interface';
import { TRole } from '../../../middlewares/roles';
import { ServiceCategoryService } from '../serviceCategory/serviceCategory.service';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { ProvidersLocation } from '../location/location.model';
import { ILocation } from '../location/location.interface';

//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
export class ServiceProviderController extends GenericController<
  typeof ServiceProvider,
  IServiceProvider
> {
  serviceProviderService = new ServiceProviderService();
  serviceCategoryService = new ServiceCategoryService();

  constructor() {
    super(new ServiceProviderService(), 'ServiceProvider');
  }

  // 💎✨🔍 -> V2 Found
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

    let createServiceProvider : ICreateServiceProviderDTO; 
    if(data.serviceCategoryId){
      console.log("hit")
      createServiceProvider = {
        serviceCategoryId : data.serviceCategoryId,
        serviceName : nameObj,
        yearsOfExperience : data.yearsOfExperience,
        startPrice : data.startPrice,
        providerId : (req.user as IUser).userId,
      }
    }else{
      console.log("miss : first create category")
      // first create category
      
      const [nameObj] : [IServiceCategory['name']]  = await Promise.all([
        buildTranslatedField(data.categoryCustomName as string)
      ]);
      
      const serviceCategoryDTO:ICreateServiceCategory = {
        // attachment will be given by admin later
        name: nameObj,
        createdBy: TRole.provider, /// as provider create this .. 
        createdByUserId : (req.user as IUser).userId // as provider create this .. admin can see .. who create this category
      }
  
      const newServiceCategory:IServiceCategory = await this.serviceCategoryService.create(serviceCategoryDTO as Partial<IServiceCategory>);
      
      // then create service provider details

      createServiceProvider  = {
        serviceCategoryId : newServiceCategory._id,
        serviceName : nameObj,
        yearsOfExperience : data.yearsOfExperience,
        startPrice : data.startPrice,
        providerId : (req.user as IUser).userId,
      }
    }

    

    const updatedServiceProvidersProfile : IUpdateProfileDTO= {
      backSideCertificateImage :  req.body.backSideCertificateImage,
      frontSideCertificateImage : req.body.frontSideCertificateImage,
      faceImageFromFrontCam : req.body.faceImageFromFrontCam
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
          providerApprovalStatus : TProviderApprovalStatus.requested // CONFUSION : age pending chilo
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

  
  // this V2
  createV2 = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateServiceProvider = req.body;

    // TODO : MUST : 
    // already ekbar serviceProviderDetails create korle .. ar create kora jabe na .. 

    // V2 Found
    function createLocation(lat : string, lng : string){
      try {
        const { address, latitude, longitude } = req.body;

        // Validate required fields
        if (!latitude || !longitude) {
          return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
          });
        }

        // Validate coordinate ranges
        if (latitude < -90 || latitude > 90) {
          return res.status(400).json({
            success: false,
            message: 'Latitude must be between -90 and 90'
          });
        }

        if (longitude < -180 || longitude > 180) {
          return res.status(400).json({
            success: false,
            message: 'Longitude must be between -180 and 180'
          });
        }

        // Create location object
        const locationData = {
          address: address || { bn: '', en: '' },
          location: {
            type: 'Point',
            coordinates: [longitude, latitude] // [longitude, latitude] - GeoJSON format
          },
          isDeleted: false
        };

        // Save to database
        // const newLocation = await Location.create(locationData);

        return res.status(201).json({
          success: true,
          message: 'Location created successfully',
          data: {
            // _id: newLocation._id,
            // address: newLocation.address,
            // coordinates: {
            //   latitude: newLocation.location.coordinates[1],
            //   longitude: newLocation.location.coordinates[0]
            // },
            // createdAt: newLocation.createdAt
          }
        });

      } catch (error: any) {
        console.error('Error creating location:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create location',
          error: error.message
        });
      }
    }

    async function createLocationV2(lat: string, lng: string) : Promise<ILocation> {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const { address } = req.body;

      if (!address) {
        throw new Error('Latitude must be between -90 and 90');
      }

      // Translate multiple properties dynamically
      const [addressObj] : [any]  = await Promise.all([
        buildTranslatedField(address as string)
      ]);


      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Latitude and longitude must be valid numbers');
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      // Save to database
      const newLocation : ILocation = await ProvidersLocation.create({
        address: addressObj,
        location :{
          type: 'Point',
          coordinates: [longitude, latitude] // [longitude, latitude] - GeoJSON format
        },
      });

      return newLocation;
    }

    // lets create location .. and provider must turn on his devices location .. 
    const createdLocation = await createLocationV2(req.body.lat, req.body.lng);
    // request er body te address pass korte hobe .. 


    // 🥇
    // Translate multiple properties dynamically
    const [nameObj] : [IServiceProvider['serviceName']]  = await Promise.all([
      buildTranslatedField(data.serviceName as string)
    ]);

    let createServiceProvider : ICreateServiceProviderDTO; 
    if(data.serviceCategoryId){
      console.log("hit")
      createServiceProvider = {
        serviceCategoryId : data.serviceCategoryId,
        serviceName : nameObj,
        yearsOfExperience : data.yearsOfExperience,
        startPrice : data.startPrice,
        providerId : (req.user as IUser).userId,
        locationId : createdLocation._id
      }
    }else{
      console.log("miss : first create category")
      // first create category
      
      const [nameObj] : [IServiceCategory['name']]  = await Promise.all([
        buildTranslatedField(data.categoryCustomName as string)
      ]);
      
      const serviceCategoryDTO:ICreateServiceCategory = {
        // attachment will be given by admin later
        name: nameObj,
        createdBy: TRole.provider, /// as provider create this .. 
        createdByUserId : (req.user as IUser).userId // as provider create this .. admin can see .. who create this category
      }
  
      const newServiceCategory:IServiceCategory = await this.serviceCategoryService.create(serviceCategoryDTO as Partial<IServiceCategory>);
      
      // then create service provider details

      createServiceProvider  = {
        serviceCategoryId : newServiceCategory._id,
        serviceName : nameObj,
        yearsOfExperience : data.yearsOfExperience,
        startPrice : data.startPrice,
        providerId : (req.user as IUser).userId,
        locationId : createdLocation._id
      }
    }

    

    const updatedServiceProvidersProfile : IUpdateProfileDTO= {
      backSideCertificateImage :  req.body.backSideCertificateImage,
      frontSideCertificateImage : req.body.frontSideCertificateImage,
      faceImageFromFrontCam : req.body.faceImageFromFrontCam
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
          providerApprovalStatus : TProviderApprovalStatus.requested // CONFUSION : age pending chilo
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
  

  uploadAttachments = catchAsync(async (req: Request, res: Response) => {
    
    // first we have to get serviceProviderDetails
    const serviceProviderDetailsId = req.query.serviceProviderDetailsId;

    const serviceProviderDetails : IServiceProvider | null = await ServiceProvider.findOne({
      _id: serviceProviderDetailsId
    });

    // TODO : ARCH : 
    // if any images are uploaded that pick that .. otherwise upload the existing ones
    
    // const updatedServiceProvidersProfile : IUploadAttachmentsForGalleryDTO= {
    //   attachmentsForGallery :  req.uploadedFiles.attachmentsForGallery ?? serviceProviderDetails?.attachmentsForGallery
    // }


    const updatedServiceProvidersProfile : IUploadAttachmentsForGalleryDTO= {
      attachmentsForGallery :  [ ...req.uploadedFiles.attachmentsForGallery,...serviceProviderDetails?.attachmentsForGallery]
    }

   
    const [updatedServiceProviderDetails] = await Promise.all([
       
       ServiceProvider.findOneAndUpdate(
        { _id: serviceProviderDetailsId },
          updatedServiceProvidersProfile,
        { new: true }
      )
    ]);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: updatedServiceProviderDetails,
      message: `Images uploaded successfully for service providers attachments section`,
      success: true,
    });

  })

  // this function allow upload attachments with other service provider details
  uploadAttachmentsV2 = catchAsync(async (req: Request, res: Response) => {
    
    const data:ICreateServiceProvider = req.body;

    // 🥇
    // Translate multiple properties dynamically
    const [nameObj] : [IServiceProvider['serviceName']]  = await Promise.all([
      buildTranslatedField(data.serviceName as string)
    ]);

    const [descriptionObj] : [IServiceProvider['serviceName']]  = await Promise.all([
      buildTranslatedField(data.description as string)
    ]);

    const [introOrBioObj] : [IServiceProvider['serviceName']]  = await Promise.all([
      buildTranslatedField(data.introOrBio as string)
    ]);

    

    // first we have to get serviceProviderDetails
    const serviceProviderDetailsId = req.query.serviceProviderDetailsId;

    const serviceProviderDetails : IServiceProvider | null = await ServiceProvider.findOne({
      _id: serviceProviderDetailsId
    });

    console.log("ServiceProviderDetails :⚡⚡: ", serviceProviderDetails);
    
    const updatedServiceProvidersProfile : IUploadAttachmentsForGalleryDTOV2 = {
      attachmentsForGallery :  [ ...req.uploadedFiles.attachmentsForGallery, ...serviceProviderDetails?.attachmentsForGallery],
      serviceName : nameObj,
      yearsOfExperience : data.yearsOfExperience,
      startPrice : data.startPrice,
      providerId : (req.user as IUser).userId,
      description : descriptionObj,
      introOrBio: introOrBioObj,
    }

   
    const [updatedServiceProviderDetails] = await Promise.all([
       
       ServiceProvider.findOneAndUpdate(
        { _id: serviceProviderDetailsId },
          updatedServiceProvidersProfile,
        { new: true }
      )
    ]);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: updatedServiceProviderDetails,
      message: `Service Providers Details Updated`,
      success: true,
    });

  })

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
      {
        path: 'providerId',
        select: 'name profileImage',
      },
      { 
        path: 'attachmentsForGallery',
        select: 'attachment'
      },
    ];
    
    const select =  defaultExcludes;

    const result = await this.service.getById(id, populateOptions, select);

    const reviews = await Review.find({ serviceProviderDetailsId: id }).populate({
      path:"userId",
      select:"name profileImage"
    }); // TODO : MUST : 

    const reviewCountPerRating = await Review.aggregate([
      {
        $match: {
          serviceProviderDetailsId: new mongoose.Types.ObjectId(id),
          isDeleted: false
        }
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          rating: "$_id",
          count: 1
        }
      },
      {
        $sort: { rating: 1 } // Sort by rating ascending (1 → 5)
      }
    ]);

    // Ensure all ratings (1–5) exist, even if count = 0 // 🧮
    const fullResult = [1, 2, 3, 4, 5].map(rating => {
      const found = reviewCountPerRating.find(r => r.rating === rating);
      return { rating, count: found ? found.count : 0 };
    });

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
        reviews,
        fullResult
      },
      message: `${this.modelName} retrieved successfully`,
    });
  });

  getOnlyAttachmentServiceNameAndInitCost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id; // this is providers userId

    // INFO: is it possible to optimize this more ?
    const populateOptions = [
      { 
        path: 'attachmentsForGallery',
        select: 'attachment'
      },
    ];
    const select = 'serviceName startPrice attachmentsForGallery';
    const result = await ServiceProvider.find({providerId : id})
    .select('serviceName startPrice attachmentsForGallery').populate({ 
      path: 'attachmentsForGallery',
      select: 'attachment'
    });

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


  getAllWithPaginationV2 = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt -__v';

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const query = {};

    // Create a copy of filter without isPreview to handle separately
    const mainFilter = { ...filters };

    // Loop through each filter field and add conditions if they exist
    for (const key of Object.keys(mainFilter)) {
      if (key === 'serviceName' && mainFilter[key] !== '') {
        // query[key] = { $regex: mainFilter[key], $options: 'i' }; // Case-insensitive regex search for name
        
        // 🔍 Search in both English and Bangla fields
        // Only set $or if it doesn't exist yet, or merge conditions
        if (!query['$or']) {
          query['$or'] = [
            { 'serviceName.en': { $regex: mainFilter[key], $options: 'i' } },
            { 'serviceName.bn': { $regex: mainFilter[key], $options: 'i' } }
          ];
        }
      
        // } else {
      } else if (mainFilter[key] !== '' && mainFilter[key] !== null && mainFilter[key] !== undefined){
        
        //---------------------------------
        // In pagination in filters when we pass empty string  it retuns all data
        //---------------------------------
        query[key] = mainFilter[key];
      }
    }

    const result = await this.service.getAllWithPagination(query, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  // with location filtering
  getAllWithPaginationV2WithLocationFiltering = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt -__v';

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const query = {};

    // Create a copy of filter without isPreview to handle separately
    const mainFilter = { ...filters };

    // Loop through each filter field and add conditions if they exist
    for (const key of Object.keys(mainFilter)) {
      if (key === 'serviceName' && mainFilter[key] !== '') {
        // query[key] = { $regex: mainFilter[key], $options: 'i' }; // Case-insensitive regex search for name
        
        // 🔍 Search in both English and Bangla fields
        // Only set $or if it doesn't exist yet, or merge conditions
        if (!query['$or']) {
          query['$or'] = [
            { 'serviceName.en': { $regex: mainFilter[key], $options: 'i' } },
            { 'serviceName.bn': { $regex: mainFilter[key], $options: 'i' } }
          ];
        }
      
        // } else {
      } else if (mainFilter[key] !== '' && mainFilter[key] !== null && mainFilter[key] !== undefined){
        
        //---------------------------------
        // In pagination in filters when we pass empty string  it retuns all data
        //---------------------------------
        query[key] = mainFilter[key];
      }
    }

    const result = await this.serviceProviderService.getAllWithAggregationV3(filters, options);

    console.log("Result with location filtering : ↪️↪️↪️", result);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
