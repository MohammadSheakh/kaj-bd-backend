import express from 'express';
import { PaymentTransactionController} from './paymentTransaction.controller';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
import { PaymentTransaction } from './paymentTransaction.model';
import { IPaymentTransaction } from './paymentTransaction.interface';
import * as validation from './paymentTransaction.validation';

import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { validateAfterSuccessfulTransaction } from '../payment/gateways/sslcommerz/sslcommerz.handler';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IPaymentTransaction | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new PaymentTransactionController();

router.route('/').get((req, res) => {
  console.log("🟢 test page");
});

//---------------------------------
// Admin | get all payment transaction with pagination
//---------------------------------
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking([
    '_id',
    'userId', // who made the transaction
    'referenceFor', // UserSubscription-Order-DoctorPatientScheduleBooking-SpecialistPatientScheduleBooking-TrainingProgramPurchase-LabTestBooking
    'referenceId',
    'paymentGateway', //stripe-none
    'transactionId',
    'paymentIntent',
    'amount',
    'currency',
    'paymentStatus'// pending-processing-completed-failed-cancelled
  ])),
  controller.getAllWithPagination
);


router.route('/paginate/dev').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking([
    '_id',
    'userId', // who made the transaction
    'referenceFor', // UserSubscription-Order-DoctorPatientScheduleBooking-SpecialistPatientScheduleBooking-TrainingProgramPurchase-LabTestBooking
    'referenceId',
    'paymentGateway', //stripe-none
    'transactionId',
    'paymentIntent',
    'amount',
    'currency',
    'paymentStatus'// pending-processing-completed-failed-cancelled
  ])),
  controller.getAllWithPaginationForDev
);

//--------------------------------
// Admin | Get Overview of Earnings
//---------------------------------
router.route('/overview/admin').get(
  auth(TRole.admin),
  controller.getEarningsOverview
);

//---------------------------------
// From kappes Backend For Stripe
//---------------------------------
router.route('/success').get(controller.successPage)
router.route('/cancel').get(controller.cancelPage);

//---------------------------------
// For SSL
//---------------------------------
/***
 * /ssl/success
 * The gateway POSTs transaction result to you here
 * You can show a nice page or redirect to client app page
 * But still call validation API before marking paid
 * 
 * SSLCommerz will POST to the success_url and then 
 * redirect client. But do not mark as paid based only
 * on redirect—use IPN/validation.
 * 
 * ** */
// router.route('/ssl/success').get(controller.successPageForSSL); // not sure
// router.post('/ssl/fail', handleSSLFail); // not sure
// router.post('/ssl/cancel', handleSSLCancel); // not sure
// router.post('/ssl/ipn', handleSSLIPN); // not sure

/**
 * This is validation API that SSLCommerz will POST to
 * based on this .. we have to update our database
 * * */
router.route('/pay/apn/validate').post(validateAfterSuccessfulTransaction); // may be method will be get

//---------------- https://github.com/sslcommerz/SSLCommerz-NodeJS 
router.route('/initiate-refund').get(controller.initiateARefundThroughAPI);
router.route('/refund-query').get(controller.refundQuery);
router.route('/transaction-query-by-transaction-id')
        .get(controller.queryTheStatusOfATransactionByTxnId);
router.route('/transaction-query-by-session-id')
        .get(controller.queryTheStatusOfATransactionBySessionId);
        

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

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/create').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  auth('common'),
  validateRequest(validation.createHelpMessageValidationSchema),
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

export const PaymentTransactionRoute = router;
