import express from 'express';
import * as validation from './doctorAppointmentSchedule.validation';
import { DoctorAppointmentScheduleController} from './doctorAppointmentSchedule.controller';
import { IDoctorAppointmentSchedule } from './doctorAppointmentSchedule.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
import { TRole } from '../../../middlewares/roles';

import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IDoctorAppointmentSchedule | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new DoctorAppointmentScheduleController();

/****
 * 
 * Doctor  | Schedule | get all schedule .. (query -> scheduleStatus[available])
 * ******* */
//
router.route('/paginate').get(
  auth(TRole.doctor, TRole.patient),
  validateFiltersForQuery(optionValidationChecking(['_id','createdBy', 'scheduleStatus', ...paginationOptions])),
  controller.getAllWithPagination
);

/********
 * 
 * Patient | Get A Doctors All Appointment Schedule 
 * 📝 here we want to show last 3 booked schedule .. two [completed] one [scheduled]
 * and all schedule of doctor which are [available]
 * ***** */
router.route('/paginate/by/patient').get(
  auth(TRole.patient),
  controller.getAllAvailableScheduleAndRecentBookedScheduleOfDoctor
)

router.route('/:id').get(
  // auth('common'),
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

//---------------------------------
// Doctor | Schedule | Create Doctor Appointment must send X-Time-Zone in header
//---------------------------------
router.route('/').post(
  auth(TRole.doctor),
  validateRequest(validation.createDoctorAppointmentScheduleValidationSchema),
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


export const DoctorAppointmentScheduleRoute = router;
