//@ts-ignore
import express from 'express';
import fileUploadHandler from '../../../shared/fileUploadHandler';
import convertHeicToPngMiddleware from '../../../shared/convertHeicToPngMiddleware';
import { UserController } from './user.controller';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import auth from '../../../middlewares/auth';
import { IUser } from './user.interface';
import { TRole } from '../../../middlewares/roles';
import validateRequest from '../../../shared/validateRequest';
const UPLOADS_FOLDER = 'uploads/users';
const upload = fileUploadHandler(UPLOADS_FOLDER);
import * as validation from './user.validation';
import { setRequestFiltersV2, setRequstFilterAndValue } from '../../../middlewares/setRequstFilterAndValue';
import { imageUploadPipelineForUpdateUserProfile } from './user.middleware';

export const optionValidationChecking = <T extends keyof IUser | 'sortBy' | 'page' | 'limit' | 'populate'>(
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

const router = express.Router();

// const taskService = new TaskService();
const controller = new UserController();

//--------------------------------- kaj-bd
// Admin | 02-01 | Get All Users from Users Table With Statistics
//---------------------------------
router.route('/paginate').get(
  auth(TRole.admin),
  validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'createdAt', ...paginationOptions])),
  setRequstFilterAndValue('role', 'user'),
  controller.getAllWithPaginationV2WithStatistics
);

//--------------------------------- kaj-bd
// Admin | 03-01 | Get All Users from Users Table
//---------------------------------
router.route('/paginate/for-user').get(
  auth(TRole.admin),
  validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'createdAt', 'from', 'to', ...paginationOptions])),
  setRequstFilterAndValue('role', 'user'),
  controller.getAllWithPaginationV2
);

//--------------------------------- kaj-bd
// Admin | 00-01 | Get All SubAdmin from Users Table
//---------------------------------
router.route('/paginate/for-sub-admin').get(
  auth(TRole.admin),
  validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'createdAt', 'from', 'to', ...paginationOptions])),
  
  setRequstFilterAndValue('role', 'subAdmin'),
  
  // setRequestFiltersV2(
  //   { 
  //     isDeleted: false,
  //     role: 'subAdmin'
  //   }
  // ),
  controller.getAllWithPaginationV2
);

//--------------------------------- fertie | kaj-bd
// Admin | 00-02 | Create Sub Admin and send invitation email 
//---------------------------------
router.post(
  "/send-invitation-link-to-admin-email",
  auth(TRole.admin),
  validateRequest(validation.sendInvitationToBeAdminValidationSchema),
  controller.sendInvitationLinkToAdminEmail
);

//---------------------------------  kaj-bd
// Admin | 00-02 | Remove Sub Admin
// :id -> here id is subAdminId 
//---------------------------------
router.put(
  "/remove-sub-admin/:id",
  auth(TRole.admin),
  controller.removeSubAdmin
);



// TODO : MUST : Get all providers who are not approved .. 

//--------------------------------- kaj-bd
// Admin | 04-01 | Get All Providers from Users Table 
//---------------------------------
router.route('/paginate/for-provider').get(
  auth(TRole.admin),
  // providerApprovalStatus must pass kora lagbe .. 
  // from and to is for date range filter
  validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'email', 'phoneNumber','role', 'providerApprovalStatus', 'from', 'to', ...paginationOptions])),
  // setRequstFilterAndValue('role', 'provider'),
  controller.getAllWithPaginationV3
);



//--------------------------------- suplify
// Specialist | Get Profile Information as logged in user 
//---------------------------------
router.route('/profile').get(
  auth(TRole.common), // any logged in user can see any user profile ..
  controller.getById
);


//--------------------------------- suplify
// Admin | Get Profile Information by Id  to approve doctor / specialist 
//---------------------------------
router.route('/profile/for-admin').get(
 auth(TRole.admin),
  validateFiltersForQuery(optionValidationChecking(['_id',
    ...paginationOptions])),
  controller.getAllWithPagination
);

//--------------------------------- suplify
// Admin | change approvalStatus of a doctor / specialist profile
//---------------------------------
router.route('/change-approval-status').put(
  auth(TRole.admin),
  // validateRequest(validation.changeApprovalStatusValidationSchema),
  controller.changeApprovalStatusByUserId
)

//--------------------------------- kaj bd
// User | Home Page | 03-01 | get category and popular providers also banners 
//---------------------------------
router.route('/home-page').get(
  // auth(TRole.user),
  controller.getCategoriesAndPopularProvidersForUser
)

//--------------------------------- kaj bd
// User | Home Page |   get only popular providers  
//---------------------------------
// TODO : MUST : Need to implement pagination .. 
router.route('/home-page/popular').get(
  // auth(TRole.user),
  controller.getPopularProvidersForUser
)


//--------------------------------- kaj bd
// Provider | Home Page | 03-01 | get earning by category, categorically booking count, all recent job request  
//---------------------------------
router.route('/home-page/for-provider').get(
  auth(TRole.provider),
  controller.getEarningAndCategoricallyBookingCountAndRecentJobRequest
)


//--------------------------------- kaj bd
// User | Profile | 06-01 | get profile information of a user 
//---------------------------------
router.route('/profile-info').get(
  auth(TRole.user, TRole.provider),
  controller.getProfileInformationOfAUser
)

/** ----------------------------------------------
 * @role User
 * @Section Profile
 * @module User|UserProfile
 * @figmaIndex 06-02
 * @desc Update profile information of a user
 *----------------------------------------------*/
router.route('/profile-info').put(
  auth(TRole.user, TRole.provider, TRole.commonAdmin),
  // validateRequest(validation.updateProfileInfoValidationSchema), // TODO : MUST : add validation
  controller.updateProfileInformationOfAUser
)

/** ----------------------------------------------
 * @role Admin
 * @Section Profile
 * @module User|UserProfile
 * @figmaIndex 06-02
 * @desc Update Profile Info with profile Image of a admin
 *----------------------------------------------*/
router.route('/profile-info/for-admin').put(
  auth(TRole.commonAdmin),
  ...imageUploadPipelineForUpdateUserProfile,
  controller.updateProfileInformationOfAdmin
)

/** ----------------------------------------------
 * @role User
 * @Section Profile
 * @module User|UserProfile
 * @figmaIndex 06-02
 * @desc Update profile Image of a user
 *----------------------------------------------*/
router.route('/profile-picture').put(
  auth(TRole.common),
  ...imageUploadPipelineForUpdateUserProfile,
  controller.updateProfileImageSeparately
)

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


export const UserRoutes = router;

