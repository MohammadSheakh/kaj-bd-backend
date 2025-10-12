import express from 'express';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import { ConversationController } from './conversation.controller';
import { IConversation } from './conversation.interface';
import auth from '../../../middlewares/auth';
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
import * as validation from './conversation.validation';
import validateRequest from '../../../shared/validateRequest';
import { TRole } from '../../../middlewares/roles';
const router = express.Router();

export const optionValidationChecking = <T extends keyof IConversation | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new ConversationController();



//
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'creatorId', 'siteId', ...paginationOptions])),
  controller.getAllWithPagination
);


router.route('/:id').get(
  // auth('common'),
  controller.getById
);

router.route('/').get(
  //auth('common'), // FIXME: maybe authentication lagbe na ..
  controller.getAll
);

//---------------------------------
// Create Conversation ..
// Do We need to give permission to upload image
//---------------------------------
router.route('/').post(
  auth(TRole.common),
  validateRequest(validation.createConversationValidationSchema),
  controller.create
);

router.route('/update/:id').put(
  //auth('common'), // FIXME: Change to admin
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
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
router.route('/participants/add').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  auth('user'),
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.addParticipantsToExistingConversation
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/participants/remove').delete(
  auth('user'),
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.removeParticipantFromAConversation
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/participants/all').get(
  //auth('common'),
  controller.showParticipantsOfExistingConversation
);

/*************
//[🚧][🧑‍💻][🧪] // ✅🆗
router.route('trigger-cron').get(
  controller.triggerCronJob
);
************ */

// 🟢 this route is already available at messsage route
// router.route('/get-all-message/:conversationId').get(
//   controllerV2.getAllMessagesOfAConversation
// )


  //--------------------------------- 
  // ( Dashboard ) | Admin :: getAllConversationAndItsParticipantsBySiteId
  //---------------------------------
  router.route('/by/siteId').get(
  //auth('common'),
  controller.getAllConversationAndItsParticipantsBySiteId
);


export const ConversationRoute = router;
