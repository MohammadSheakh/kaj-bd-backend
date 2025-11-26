//@ts-ignore
import express from 'express';
import * as validation from './supportMessage.validation';
import { SupportMessageController} from './supportMessage.controller';
import { ISupportMessage } from './supportMessage.interface';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../shared/validateRequest';
import auth from '../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../middlewares/roles';
import { imageUploadPipelineForCreateSupportMessage } from './supportMessage.middleware';
import { setQueryOptions } from '../../middlewares/setQueryOptions';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof ISupportMessage | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new SupportMessageController();

router.route('/paginate').get(
  auth(TRole.commonAdmin),
  validateFiltersForQuery(optionValidationChecking(['_id', 'isResolved', ...paginationOptions])),
  setQueryOptions({
    populate: [
      { path: 'attachments', select: 'attachment' },
      { path: 'creatorId', select: 'name profileImage email phoneNumber role' },
    ],
    select: '-isDeleted -updatedAt'
  }),
  controller.getAllWithPaginationV2
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

/** ----------------------------------------------
   * @role Admin
   * @Section Support Message
   * @module SupportMessage |
   * @figmaIndex 0-0
   * @desc as per clients need .. change status of support message
   * 
   *----------------------------------------------*/
router.route('/change-satus/:id').put(
  auth(TRole.commonAdmin),
  controller.changeResolveSatus
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth('commonAdmin'),
  controller.getAll
);

/** ----------------------------------------------
   * @role User
   * @Section Support Message
   * @module SupportMessage |
   * @figmaIndex 0-0
   * @desc as per clients need 
   * 
   *----------------------------------------------*/
router.route('/').post(
  auth(TRole.commonUser),
  // validateRequest(validation.createHelpMessageValidationSchema),
  ...imageUploadPipelineForCreateSupportMessage,
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


export const SupportMessageRoute = router;
