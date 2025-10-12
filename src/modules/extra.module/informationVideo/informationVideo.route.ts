//@ts-ignore
import express from 'express';
import * as validation from './informationVideo.validation';
import { informationVideoController} from './informationVideo.controller';
import { IinformationVideo } from './informationVideo.interface';
import { TRole } from '../../../middlewares/roles';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import auth from '../../../middlewares/auth';
import validateRequest from '../../../shared/validateRequest';
//@ts-ignore
import multer from "multer";
import { getLoggedInUserAndSetReferenceToUser } from '../../../middlewares/getLoggedInUserAndSetReferenceToUser';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IinformationVideo | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new informationVideoController();

//---------------------------------
// Specialist  | Information Video | View all infomation video for logged in specialist 
// TODO : return only important fields 
//---------------------------------
router.route('/paginate').get(
  auth(TRole.specialist), // can not assign other role here .. 
  validateFiltersForQuery(optionValidationChecking(['_id', ...paginationOptions])),
  getLoggedInUserAndSetReferenceToUser('createdBy'), // always filter by createdBy logged in user
  controller.getAllWithPagination
);

//---------------------------------
// Patient | Landing Page | Information video 
// only subscription -> (standard  + above) patient can view the video
//---------------------------------
router.route('/paginate/patient').get(
  auth(TRole.patient),
  validateFiltersForQuery(optionValidationChecking(['_id','createdBy', ...paginationOptions])),
  controller.getAllWithPaginationForPatient
);

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
// Specialist | Information Video | Create Infomation video .. 
//---------------------------------
router.route('/').post(
  [
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'video', maxCount: 1 }
    ]),
  ],
  auth(TRole.specialist),
  validateRequest(validation.createInfomationVideoValidationSchema),
  controller.createWithAttachments
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


export const informationVideoRoute = router;