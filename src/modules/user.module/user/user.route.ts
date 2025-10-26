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

//--------------------------------- suplify
// Admin : User Management With Statistics
//---------------------------------
//
router.route('/paginate').get(
  auth(TRole.admin),
  validateFiltersForQuery(optionValidationChecking(['_id',
    'name',
    'email',
    'role',
    'subscriptionType',
    'approvalStatus',
    ...paginationOptions])),
  controller.getAllWithPaginationV2
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
  validateRequest(validation.changeApprovalStatusValidationSchema),
  controller.changeApprovalStatusByUserId
)

//--------------------------------- kaj bd
// User | Home Page | 03-01 | get category and popular providers also banners 
//---------------------------------
router.route('/home-page').get(
  auth(TRole.user),
  controller.getCategoriesAndPopularProvidersForUser
)

//--------------------------------- kaj bd
// User | Profile | 06-01 | get profile information of a user 
//---------------------------------
router.route('/profile-info').get(
  auth(TRole.user),
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
  auth(TRole.user),
  // validateRequest(validation.updateProfileInfoValidationSchema), // TODO : MUST : add validation
  controller.updateProfileInformationOfAUser
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

