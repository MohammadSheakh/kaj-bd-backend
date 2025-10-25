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
import { imageUploadPipelineForCreateServiceProviderInformation } from './serviceProvider.middleware';
import { setRequestFiltersV2 } from '../../../middlewares/setRequstFilterAndValue';
import { TProviderApprovalStatus } from '../../user.module/userRoleData/userRoleData.constant';
import { setQueryOptions } from '../../../middlewares/setQueryOptions';
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
  validateFiltersForQuery(optionValidationChecking(['_id', 'serviceCategoryId', ...paginationOptions])),
  setRequestFiltersV2({
    isDeleted: false,
    providerApprovalStatus: TProviderApprovalStatus.accept,
  }),
  setQueryOptions({
    populate: [
      { path: 'attachmentsForGallery', select: 'attachment' },
    ],
    select: '-isDeleted -createdAt -updatedAt'
  }),
  controller.getAllWithPaginationV2
);

//---------------------------------  
// User | 03-06 get a service provider's details with reviews
// for  (FIG : User | 03-06) book service now button for providerId pass --> "providerId._userId"
//---------------------------------
router.route('/:id').get(
  auth(TRole.user),
  controller.getByIdWithReviews
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

//----------------------------------------
// Service Provider | After Registration 
// This Information must need for provider to be visible to users 
//----------------------------------------
router.route('/').post(
  auth(TRole.provider),
  ...imageUploadPipelineForCreateServiceProviderInformation, //🥇
  // validateRequest(validation.createHelpMessageValidationSchema), // TODO add validation
  controller.create
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
