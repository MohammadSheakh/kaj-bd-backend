import express from 'express';
import * as validation from './additionalCost.validation';
import { AdditionalCostController} from './additionalCost.controller';
import { IAdditionalCost } from './additionalCost.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';

import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { IsProviderRejected } from '../../../middlewares/provider/IsProviderRejected';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IAdditionalCost | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new AdditionalCostController();

//
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', ...paginationOptions])),
  controller.getAllWithPagination
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

//-----------------------------------
// Provider | 03-09 | Create additional cost 
//-----------------------------------
router.route('/').post(
  auth(TRole.provider),
  IsProviderRejected(),
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.create
);

//-----------------------------------
// Provider | Hard Delete additional cost  🆕
//-----------------------------------
router.route('/:id').delete(
  auth(TRole.provider),
  IsProviderRejected(),
  controller.deleteById
); // FIXME : change to admin

router.route('/softDelete/:id').put(
  //auth('common'),
  controller.softDeleteById
);

////////////
//[🚧][🧑‍💻✅][🧪] // 🆗


export const AdditionalCostRoute = router;
