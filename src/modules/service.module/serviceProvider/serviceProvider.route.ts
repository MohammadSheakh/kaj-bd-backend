//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
//@ts-ignore
import express from 'express';
import * as validation from './serviceProvider.validation';
import { ServiceProviderController} from './serviceProvider.controller';
import { IServiceProvider } from './serviceProvider.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { imageUploadPipelineForCreateServiceProviderInformation, imageUploadPipelineForUpdateAttachmentsOfServiceProvider } from './serviceProvider.middleware';
import { setRequestFiltersV2 } from '../../../middlewares/setRequstFilterAndValue';
import { TProviderApprovalStatus } from '../../user.module/userRoleData/userRoleData.constant';
import { setQueryOptions } from '../../../middlewares/setQueryOptions';
import { IsProviderRejected } from '../../../middlewares/provider/IsProviderRejected';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

export const optionValidationChecking = <T extends keyof IServiceProvider | 'sortBy' | 'page' | 'limit' | 'populate'>(
  filters: T[]
) => {
  return filters;
};

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

// const taskService = new TaskService();
const controller = new ServiceProviderController();

//---------------------------------
// User | 03-05 Get all service provider for a serviceCategoryId
//---------------------------------
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'serviceCategoryId', 'serviceName', ...paginationOptions])),
  setRequestFiltersV2({
    isDeleted: false,
    providerApprovalStatus: TProviderApprovalStatus.accept,
  }),
  setQueryOptions({
    populate: [
      { path: 'attachmentsForGallery', select: 'attachment' },
      { path: 'providerId', select: 'name profileImage' },
    ],
    select: '-isDeleted -createdAt -updatedAt'
  }),
  controller.getAllWithPaginationV2
);

  // userLatitude, 
  // userLongitude, 
  // maxDistance = 10000, // in meters (default 10km)

router.route('/paginate/by-location').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'serviceCategoryId', 'serviceName', 'userLatitude', 'userLongitude', 'maxDistance', ...paginationOptions])),
  
  //----------------------------- THis is so important .. we need to get those providers who are approved by admin
  // setRequestFiltersV2({
  //   isDeleted: false,
  //   providerApprovalStatus: TProviderApprovalStatus.accept,
  // }),

  // setQueryOptions({
  //   populate: [
  //     { path: 'attachmentsForGallery', select: 'attachment' },
  //     { path: 'providerId', select: 'name profileImage' },
  //   ],
  //   select: '-isDeleted -createdAt -updatedAt'
  // }),
  controller.getAllWithPaginationV2WithLocationFiltering
);

//---------------------------------  
// Provider | 06-03 | get a service provider's documents for profile section also Images from userProfile 
//---------------------------------
router.route('/details-with-nid').get(
  auth(TRole.provider),
  IsProviderRejected(),
  controller.getServiceProviderDetailsAndNIDImagesFromUserProfile
);

//--------------------------------- ⚔️💪🏔️
// User | 03-06 get a service provider's details with reviews
// for  (FIG : User | 03-06) book service now button for providerId pass --> "providerId._userId"
//---------------------------------
router.route('/:id').get(
  auth(TRole.user),
  controller.getByIdWithReviews
);

// pass providers userId
router.route('/limited-info/:id').get(
  auth(TRole.user),
  controller.getOnlyAttachmentServiceNameAndInitCost
);



//---------------------------------  
// User | 03-08 get a service provider's profile details 
//---------------------------------
router.route('/profile/:id').get(
  controller.getProfileDetails
);




router.route('/update/:id').put(
  //auth('common'),
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth('commonAdmin'),
  controller.getAll
);

//---------------------------------------- 💎✨🔍 -> V2 Found
// Service Provider | After Registration 
// This Information must need for provider to be visible to users 
//----------------------------------------
router.route('/').post(
  auth(TRole.provider),
  IsProviderRejected(),
  ...imageUploadPipelineForCreateServiceProviderInformation, //🥇
  // validateRequest(validation.createHelpMessageValidationSchema), // TODO add validation
  controller.create
);

//----------------------------------------
// Service Provider | After Registration 
// client want to search provider with in a location .. for that we need to store
// providers location into location collection and link it with service provider 
//----------------------------------------
router.route('/with-locationInfo').post(
  auth(TRole.provider),
  // this api does not need IsProviderRejected bcus provider is creating his info first time
  ...imageUploadPipelineForCreateServiceProviderInformation, 
  // validateRequest(validation.createHelpMessageValidationSchema), // TODO add validation
  controller.createV2
);

/** ---------------------------------------------- V2 Found
   * @role Provider
   * @Section Profile -> Documents
   * @module UserProfile |
   * @figmaIndex 06-03
   * @desc to upload images for service providers gallery
   * 
   *----------------------------------------------*/
router.route('/upload-attachments').put(
  auth(TRole.provider),
  IsProviderRejected(),
  ...imageUploadPipelineForUpdateAttachmentsOfServiceProvider, //🥇
  controller.uploadAttachments
);

/** ----------------------------------------------
   * @role Provider
   * @Section Profile -> Documents
   * @module UserProfile |
   * @figmaIndex 06-03
   * @desc to upload images for service providers gallery with other information .. 
   * 
   *----------------------------------------------*/
router.route('/upload-attachments-v2').put(
  auth(TRole.provider),
  IsProviderRejected(),
  ...imageUploadPipelineForUpdateAttachmentsOfServiceProvider, //🥇
  controller.uploadAttachmentsV2
);

router.route('/delete/:id').delete(
  //auth('common'),
  controller.deleteById
); // FIXME : change to admin

router.route('/softDelete/:id').put(
  //auth('common'),
  controller.softDeleteById
);

////////////
//[🚧][🧑‍💻✅][🧪] // 🆗


export const ServiceProviderRoute = router;
