//@ts-ignore
import express from 'express';
import * as validation from './serviceCategory.validation';
import { ServiceCategoryController} from './serviceCategory.controller';
import { IServiceCategory } from './serviceCategory.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { imageUploadPipelineForCreateServiceCategory, imageUploadPipelineForUpdateServiceCategory } from './serviceCategory.middleware';
import { setQueryOptions } from '../../../middlewares/setQueryOptions';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IServiceCategory | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new ServiceCategoryController();

//---------------------------------
// Admin / SubAdmin / User | 05-01 Get all service with isVisible flag
//---------------------------------
router.route('/paginate').get(
  validateFiltersForQuery(optionValidationChecking(['_id', 'isDeleted', 'isVisible', 'isDeleted', ...paginationOptions])),
  setQueryOptions({
    populate: [
      { path: 'attachments', select: 'attachment' },
    ],
    select: '-isDeleted -createdAt -updatedAt'
  }),
  controller.getAllWithPaginationV2
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

//---------------------------------
// Admin / SubAdmin | 05-03 Update New Service
//---------------------------------
router.route('/:id').put(
  auth(TRole.commonAdmin),
  ...imageUploadPipelineForUpdateServiceCategory,
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth(TRole.common),
  setQueryOptions({
    populate: [
      { path: 'attachments', select: 'attachment' },
    ],
    select: 'name' // -isDeleted -createdAt -updatedAt
  }),
  controller.getAllV2
);

//---------------------------------
// Admin / SubAdmin | 05-02 Create New Service
//---------------------------------
router.route('/').post(
  auth(TRole.commonAdmin),
  ...imageUploadPipelineForCreateServiceCategory,
  // validateRequest(validation.createHelpMessageValidationSchema), // TODO : must add validation
  controller.create
);

//--------- when user create serviceProviderDetails .. we need to create this category automatically 
// router.route('/by-provider').post(
//   // validateRequest(validation.createHelpMessageValidationSchema), // TODO : must add validation
//   controller.createByProvider
// );

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


export const ServiceCategoryRoute = router;
