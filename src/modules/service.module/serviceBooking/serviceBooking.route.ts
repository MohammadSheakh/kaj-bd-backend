//@ts-ignore
import express from 'express';
import * as validation from './serviceBooking.validation';
import { ServiceBookingController} from './serviceBooking.controller';
import { IServiceBooking } from './serviceBooking.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { setQueryOptions } from '../../../middlewares/setQueryOptions';
import { defaultExcludes } from '../../../constants/queryOptions';
import { getLoggedInUserAndSetReferenceToUser } from '../../../middlewares/getLoggedInUserAndSetReferenceToUser';
import { checkLoggedInUsersPermissionToManipulateModel } from '../../../middlewares/checkPermissionToManipulateModel';
import { checkProviderCanAcceptBooking, checkProviderCanCancelBooking, checkProviderCanMakeInProgressOfThisBooking, checkProviderCanMakeRequestForPaymentOfThisBooking, checkUserCanCancelBooking, imageUploadPipelineForUpdateServiceBooking, imageUploadPipelineForUpdateServiceCategory } from './serviceBooking.middleware';
import { allowOnlyFields } from '../../../middlewares/allowOnlyFields';
import { TBookingStatus } from './serviceBooking.constant';
import { filterByDateRange } from '../../../middlewares/filterByDateRange';
import { IsProviderRejected } from '../../../middlewares/provider/IsProviderRejected';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IServiceBooking | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new ServiceBookingController();

//-------------------------------------------
// User | 04-01 | Get all pending Bookings 
// User | 04-03 | Get all accepted Bookings 
//-------------------------------------------
router.route('/paginate').get(
  auth(TRole.user),
  validateFiltersForQuery(optionValidationChecking(['_id','status', ...paginationOptions])),
  getLoggedInUserAndSetReferenceToUser('userId'),
  setQueryOptions({
    populate: [
      { path: 'providerDetailsId', select: 'serviceName'},
      { path: 'providerId', select: 'name profileImage role'},
    ],
    select: `address bookingDateTime startPrice hasReview`// address bookingDateTime startPrice
    // ${defaultExcludes}
  }),
  controller.getAllWithPaginationV2
);

// for user ... as per toky vai's requirement
router.route('/paginate/tokiVai').get(
  auth(TRole.user),
  validateFiltersForQuery(optionValidationChecking(['_id','status', ...paginationOptions])),
  getLoggedInUserAndSetReferenceToUser('userId'),
  setQueryOptions({
    populate: [
      { path: 'providerDetailsId', select: 'serviceName'},
      { path: 'providerId', select: 'name profileImage role'},
      { path: 'attachments', select: 'attachment'}, 
    ],
    select: `address bookingDateTime startPrice hasReview paymentTransactionId paymentMethod paymentStatus`// address bookingDateTime startPrice
    // ${defaultExcludes}
  }),
  controller.getAllWithPaginationV2
);


//-------------------------------------------
// Admin | 06-01 | Get all service booking for work tracker
//-------------------------------------------
router.route('/paginate/for-admin').get(
  auth(TRole.commonAdmin),
  validateFiltersForQuery(optionValidationChecking(['_id','status', 'from', 'to', ...paginationOptions])),
  filterByDateRange(),
  setQueryOptions({
    populate: [
      { path: 'providerDetailsId', select: 'serviceName rating' },
      { path: 'userId', select: 'name profileImage role phoneNumber' },
      { path: 'providerId', select: 'name profileImage role phoneNumber' },
    ],
    select: `address bookingDateTime completionDate startPrice hasReview status`
  }),
  // service provider er rating show kora lagbe 
  controller.getAllWithPaginationV2ForAdmin
);

//-------------------------------------------
// Provider | 03-04 | Get all Job Request
//-------------------------------------------
router.route('/paginate/for-provider').get(
  auth(TRole.provider),
  IsProviderRejected(),
  validateFiltersForQuery(optionValidationChecking(['_id','status', ...paginationOptions])),
  getLoggedInUserAndSetReferenceToUser('providerId'),
  setQueryOptions({
    populate: [
      { path: 'userId', select: 'name profileImage role' },
    ],
    select: `address bookingDateTime `//startPrice hasReview
    // ${defaultExcludes}
  }),
  controller.getAllWithPaginationV2
);


//-------------------------------------------
// User | 06-05 | Get a booking history details with transaction details 
//-------------------------------------------
router.route('/withTxnHistory/:id').get(
  auth(TRole.user),
  setQueryOptions({
    populate: [
      { path: 'providerId', select: 'name profileImage role' },
    ],
    select: `${defaultExcludes}`
  }),
  // controller.getByIdWithTxnHistory
  controller.getByIdV2
);


//-------------------------------------------
// User | 04-10 bookings | show details of service booking With Cost Summary With Review If Provider
//        04-20 
// Provider | 04-11 
//-------------------------------------------
router.route('/with-costs-summary/:id').get(
  auth(TRole.user, TRole.provider),
  // controller.getById
  controller.getWithAdditionalCosts
);

//-------------------------------------------
// Admin | 06-03 bookings | show details of service booking With Cost Summary If Completed 
//-------------------------------------------
router.route('/with-costs-summary/for-admin/:id').get(
  auth(TRole.commonAdmin),
  controller.getWithAdditionalCostsForAdmin
);


//-------------------------------------------
// Provider | 03-05 Home | get booking details with user  information
// ISSUE : This version is not return users phone number .. 💎✨🔍 -> V2 Found
//------------------------------------------- 
router.route('/user-details/:id').get(
  auth(TRole.provider),
  IsProviderRejected(),
  setQueryOptions({
    populate: [{
      path: 'userId', //userId 
      select: 'phoneNumber name profileImage role', //🆕phoneNumber  // name profileImage role 
      populate: { path: 'profileId', select: 'gender location' }
    }],
    select: `startPrice address bookingDateTime status`
  }),
  controller.getByIdV2
);

router.route('/user-details-v2/:id').get(
  auth(TRole.provider),
  IsProviderRejected(),
  controller.getBookingDetailsWithUserDetails
);

//-------------------------------------------
// Provider | 03-04 Home | accept job request
//-------------------------------------------
router.route('/update-status/:id/status/accept').put(
  auth(TRole.provider),
  IsProviderRejected(),
  checkLoggedInUsersPermissionToManipulateModel(
    'ServiceBooking',
    'providerId',
    true,
    "_id"
  ),
  checkProviderCanAcceptBooking(),
  allowOnlyFields([], { status: TBookingStatus.accepted }), // ✅ no user input, status auto-set
  // validateRequest(validation.createHelpMessageValidationSchema), // i think we dont need validation
  controller.updateById
);

//-------------------------------------------
// Provider | 03-04 Home | cancel job request
//-------------------------------------------
router.route('/update-status/:id/status/cancel-by-provider').put(
  auth(TRole.provider),
  IsProviderRejected(),
  checkLoggedInUsersPermissionToManipulateModel(
    'ServiceBooking',
    'providerId',
    true,
    "_id"
  ),
  checkProviderCanCancelBooking(),
  allowOnlyFields([], { status: TBookingStatus.cancelled }), // ✅ no user input, status auto-set
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);

//-------------------------------------------
// Provider | 03-06 Home | make a job inProgress which means start work
//-------------------------------------------
router.route('/update-status/:id/status/inProgress').put(
  auth(TRole.provider),
  IsProviderRejected(),
  checkLoggedInUsersPermissionToManipulateModel(
    'ServiceBooking', 
    'providerId',
    true,
    "_id"
  ),
  checkProviderCanMakeInProgressOfThisBooking(),
  allowOnlyFields([], { status: TBookingStatus.inProgress }), // ✅ no user input, status auto-set
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);

//--------- For Message .. Check Create Conversation API 

//-------------------------------------------
// Provider | 03-09 Home | make a paymentRequest 
//-------------------------------------------
router.route('/update-status/:id/status/paymentRequest').put(
  auth(TRole.provider),
  IsProviderRejected(),
  checkLoggedInUsersPermissionToManipulateModel(
    'ServiceBooking', 
    'providerId',
    true,
    "_id"
  ),
  checkProviderCanMakeRequestForPaymentOfThisBooking(),
  allowOnlyFields([
    'duration',
    'completionDate',
  ], { status: TBookingStatus.paymentRequest }), // ✅ no user input, status auto-set
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);


//-------------------------------------------
// Provider | 03-09 Home | Upload Proof of Work Before make a paymentRequest 
//-------------------------------------------
router.route('/update-work-proof/:id').put(
  auth(TRole.provider),
  IsProviderRejected(),
  checkLoggedInUsersPermissionToManipulateModel(
    'ServiceBooking', 
    'providerId',
    true,
    "_id"
  ),

  ...imageUploadPipelineForUpdateServiceBooking,

  checkProviderCanMakeRequestForPaymentOfThisBooking(), // its also work for upload image and we manage image upload here 
  
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);


//-------------------------------------------
// User | 04-02 Home | cancel job request
//-------------------------------------------
router.route('/update-status/:id/status/cancel').put(
  auth(TRole.user),
  checkLoggedInUsersPermissionToManipulateModel(
    'ServiceBooking', 
    'userId',
    true,
    "_id"
  ),
  checkUserCanCancelBooking(),
  allowOnlyFields([], { status: TBookingStatus.cancelled }), // ✅ no user input, status auto-set
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth('commonAdmin'),
  controller.getAll
);

//---------------------------------------
// User | Create A Service Booking 
// For make payment and complete a booking .. we have to create another endpoint 
//---------------------------------------
router.route('/').post(
  auth(TRole.user),
  validateRequest(validation.bookAServiceValidationSchema),
  controller.create
);

//---------------------------------------
// User | Before Create A Service Booking we need to check with in half hour time range if provider is free or not   
//---------------------------------------
router.route('/schedule-check').post(
  auth(TRole.user),
  controller.checkForOverlapScheduleBeforeCreate
);

//---------------------------------------
// User | 04-(10/11) Make Payment For Service Booking To Admin 
// from req.body .. we get bookingId
// we have loggedIn User Id who pay
// :id is bookingId  
//---------------------------------------
router.route('/pay/create/:id').post(
  auth(TRole.user),  
  controller.makePayment
)


//------------------------------------- 🆕
//
// As Imtiaz vai face issue to pay with backends Url .. 
// now may be we can try something like .. Rakibul vai will pay in front end ..
// so for that .. he needs to know the price..
// lets calculate the price and give that to Front end .. so that Rakibul vai can pay and hit another
// api that .. payment is successful
//--------------------------------------
router.route('/get-total-price-to-pay/:id').get(
  auth(TRole.user),  
  controller.getTotalPriceToPay
)


router.route('/delete/:id').delete(
  //auth('common'),
  controller.deleteById
); // FIXME : change to admin

router.route('/softDelete/:id').put(
  //auth('common'),
  controller.softDeleteById
);

export const ServiceBookingRoute = router;


//-------------------------------------------
// Provider | 03-06 Home | make a job inProgress which means start work
//-------------------------------------------
// router.route('/update-status/:id/status/inProgress').put(
//   auth(TRole.provider),
//   checkLoggedInUsersPermissionToManipulateModel(
//     'ServiceBooking', 
//     'providerId',
//     true,
//     "_id"
//   ),
//   checkProviderCanMakeInProgressOfThisBooking(),
//   allowOnlyFields([], { status: TBookingStatus.inProgress }), // ✅ no user input, status auto-set
//   // validateRequest(validation.createHelpMessageValidationSchema),
//   controller.updateById
// );