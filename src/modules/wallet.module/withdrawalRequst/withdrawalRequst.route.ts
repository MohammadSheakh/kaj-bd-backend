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
import { filterByDateRange } from '../../../middlewares/filterByDateRange';
import { IsProviderRejected } from '../../../middlewares/provider/IsProviderRejected';
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

router.route('/paginate').get(
  auth(TRole.provider),
  IsProviderRejected(),
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


//---------------------------------
// Admin | 07-01 Show All Withdraw Request .. which status is requested .. filter by from and to date
//---------------------------------
router.route('/paginate/for-admin').get(
  auth(TRole.admin, TRole.subAdmin),
  validateFiltersForQuery(optionValidationChecking(['_id', 'status', 'from', 'to', ...paginationOptions])),
  filterByDateRange(),
  setQueryOptions({
    populate: [
      { path: 'proofOfPayment', select: 'attachment', /* populate: { path : ""} */ },
      { path: 'userId', select: 'name profileImage email phoneNumber', /* populate: { path : ""} */ },
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
//  Admin | 07-02 Upload receipt And Update status :id actually withdrawalRequestId [approved]
//---------------------------------
router.route('/:id').put(
  auth(TRole.admin, TRole.subAdmin),
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
// 06-06
// Provider  | Wallet | Create withdrawal request
//---------------------------------
router.route('/').post(
  auth(TRole.provider),
  IsProviderRejected(),
  // validateRequest(validation.createWithdrawalRequstValidationSchema),
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
