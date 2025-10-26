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
      { path: 'providerDetailsId', select: 'serviceName' },
      { path: 'providerId', select: 'name profileImage role' },
    ],
    select: `address bookingDateTime startPrice hasReview`// address bookingDateTime startPrice
    // ${defaultExcludes}
  }),
  controller.getAllWithPaginationV2
);

//-------------------------------------------
// Provider | 03-04 | Get all Job Request
//-------------------------------------------
router.route('/paginate/for-provider').get(
  auth(TRole.provider),
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
// User | 04-01 bookings | TODO :::: Cancel Booking
//-------------------------------------------

//-------------------------------------------
// User | 04-10 bookings | show details of service booking With Cost Summary
//-------------------------------------------
router.route('/:id').get(
  auth(TRole.user),
  setQueryOptions({
    populate: [],
    select: `startPrice address bookingDateTime status paymentTransactionId`
    // ${defaultExcludes}
  }),
  // controller.getById
  controller.getByIdV2
);

//-------------------------------------------
// Provider | 03-05 Home | get booking details with user  information
//-------------------------------------------
router.route('/user-details/:id').get(
  auth(TRole.provider),
  setQueryOptions({
    populate: [ { 
      path: 'userId', 
      select: 'name profileImage role',
      populate: { path: 'profileId', select: 'gender location' }
    }],
    select: `startPrice address bookingDateTime status`
    // ${defaultExcludes}
  }),
  // controller.getById
  controller.getByIdV2
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

//---------------------------------------
// User | Create A Service Booking 
// For make payment and complete a booking .. we have to create another endpoint 
//---------------------------------------
router.route('/').post(
  auth(TRole.user),
  validateRequest(validation.bookAServiceValidationSchema),
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


export const ServiceBookingRoute = router;
