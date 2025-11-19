//@ts-ignore
import express from 'express';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import { IMessage } from './message.interface';
import { MessageController } from './message.controller';
import auth from '../../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import { MessageControllerV2 } from './messageV2.controller';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IMessage | 'sortBy' | 'page' | 'limit' | 'populate'>(filters: T[]) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new MessageControllerV2() //🆕 MessageController();

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

//
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'conversationId', ...paginationOptions])),
  controller.getAllWithPagination 
);

router.route('/:id').get(
  // auth('common'),
  controller.getById 
);

router.route('/update/:id').put(
  //auth('common'), // FIXME: Change to admin
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);

router.route('/').get(
  //auth('common'), // FIXME: maybe authentication lagbe na .. 
  controller.getAll 
);

//---------------------------------
//we need this to create a message with attachments
// or just to upload attachments in chat 
//---------------------------------

// [🚧][🧑‍💻✅][🧪] // 🆗
router.route('/create').post(
  [
    upload.fields([
      { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
    ]),
  ],
  auth(TRole.common),
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.create
);

/********
// [🚧][🧑‍💻✅][🧪] // 🆗 get All messages By ConversationId 
router.route('/all/by/').get(
  //auth('common'),
  controller.getAllMessageByConversationId
);
****** */

router
  .route('/delete/:id')
  .delete(
    //auth('common'),
    controller.deleteById); // FIXME : change to admin

router
.route('/softDelete/:id')
.put(
  //auth('common'),
  controller.softDeleteById);

export const MessageRoute = router;
