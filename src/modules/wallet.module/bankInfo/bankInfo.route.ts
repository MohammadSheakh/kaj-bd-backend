//@ts-ignore
import express from 'express';
import * as validation from './bankInfo.validation';
import { BankInfoController} from './bankInfo.controller';
import { IBankInfo } from './bankInfo.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { getLoggedInUserAndSetReferenceToUser } from '../../../middlewares/getLoggedInUserAndSetReferenceToUser';
import { IsProviderRejected } from '../../../middlewares/provider/IsProviderRejected';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IBankInfo | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new BankInfoController();

router.route('/paginate').get(
  auth(TRole.provider),
  IsProviderRejected(),
  validateFiltersForQuery(optionValidationChecking(['_id',...paginationOptions])),
  getLoggedInUserAndSetReferenceToUser("userId"),
  controller.getAllWithPagination
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

/************
 * 
 * Wallet | create or update bank info
 * 
 * as to create a withdrawal request .. 
 * a specialist or doctor must have bankInformation
 * 
 * so that admin can send money to that bank offline
 * and upload a proof of that payment receipt
 * 
 * ********** */
router.route('/create-or-update').put(
  auth(TRole.provider),
  IsProviderRejected(),
  validateRequest(validation.createOrUpdateBankInfoValidationSchema),
  controller.createOrUpdate
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth('commonAdmin'),
  controller.getAll
);

router.route('/').post(
  
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


export const BankInfoRoute = router;
