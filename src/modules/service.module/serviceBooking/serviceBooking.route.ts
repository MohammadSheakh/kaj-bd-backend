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
// User 
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
// User | 04-01 bookings | TODO :::: Cancel Booking
//-------------------------------------------

//-------------------------------------------
// User | 04-10 bookings | show details of service booking With Cost Summary
//-------------------------------------------
router.route('/:id').get(
  auth(TRole.user),
  controller.getById
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
