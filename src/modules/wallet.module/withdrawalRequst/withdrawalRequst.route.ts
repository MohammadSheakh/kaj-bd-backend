//@ts-ignore
import express from 'express';
import * as validation from './withdrawalRequst.validation';
import { WithdrawalRequstController} from './withdrawalRequst.controller';
import { IWithdrawalRequst } from './withdrawalRequst.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { setRequstFilterAndValue } from '../../../middlewares/setRequstFilterAndValue';
import { TWithdrawalRequst } from './withdrawalRequst.constant';
import { setQueryOptions } from '../../../middlewares/setQueryOptions';
import { getLoggedInUserAndSetReferenceToUser } from '../../../middlewares/getLoggedInUserAndSetReferenceToUser';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IWithdrawalRequst | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new WithdrawalRequstController();

//---------------------------------
// Admin | Show All Withdraw Request .. which status is requested
//---------------------------------

router.route('/paginate').get(
  auth(TRole.specialist , TRole.doctor),
  validateFiltersForQuery(optionValidationChecking(['_id', ...paginationOptions])),
  getLoggedInUserAndSetReferenceToUser('userId'),
  // setRequstFilterAndValue('status', TWithdrawalRequst.requested), // requested 
  setQueryOptions({
    populate: [
      { path: 'proofOfPayment', select: 'attachment', /* populate: { path : ""} */ },
      { path : "walletId", select: "amount"}
    ],
    select: '-isDeleted -createdAt -updatedAt -__v'
  }),
  controller.getAllWithPaginationV2WithWalletAmount
);

router.route('/paginate/for-admin').get(
  auth(TRole.admin),
  validateFiltersForQuery(optionValidationChecking(['_id', 'status', ...paginationOptions])),
  // setRequstFilterAndValue('status', TWithdrawalRequst.requested), // requested 
  setQueryOptions({
    populate: [
      { path: 'proofOfPayment', select: 'attachment', /* populate: { path : ""} */ },
    ],
    select: '-isDeleted -createdAt -updatedAt -__v'
  }),
  controller.getAllWithPaginationV2
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

//---------------------------------
//  Admin | Upload receipt And Update status :id actually withdrawalRequestId
//---------------------------------
router.route('/:id').put(
  auth(TRole.admin),
  [
    upload.fields([
      { name: 'proofOfPayment', maxCount: 1 }, // Allow up to 1 photos
    ]),
  ],
  validateRequest(validation.updateStatusOfWithdrawalRequestValidationSchema),
  controller.uploadReceiptAndUpdateStatus //updateById
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth('commonAdmin'),
  controller.getAll
);


//--------------------------------- 
// Specialist / Doctor  | Wallet | Create withdrawal request
//---------------------------------
router.route('/').post(
  auth(TRole.doctor, TRole.specialist),
  validateRequest(validation.createWithdrawalRequstValidationSchema),
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


export const WithdrawalRequstRoute = router;
