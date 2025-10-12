import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { AttachmentController } from './attachment.controller';

const multer = require('multer');
// import fileUploadHandler from '../../shared/fileUploadHandler';
// import convertHeicToPngMiddleware from '../../shared/convertHeicToPngMiddleware';
// const UPLOADS_FOLDER = 'uploads/users';
// const upload = fileUploadHandler(UPLOADS_FOLDER);

const router = express.Router();

//
router.route('/paginate').get(
  auth('common'),
  AttachmentController.getAllAttachmentWithPagination
);

router.route('/:attachmentId').get(
  auth('common'),
  AttachmentController.getAAttachment
);

router.route('/update/:attachmentId').put(
  auth('common'),
  // validateRequest(validation.createHelpMessageValidationSchema),
  AttachmentController.updateById
);

router.route('/addOrRemoveReact/:attachmentId').put(
  auth('common'),
  // validateRequest(validation.createHelpMessageValidationSchema),
  AttachmentController.addOrRemoveReact
);

router.route('/').get(
  auth('common'),
  AttachmentController.getAllAttachment
);

// router.route('/create').post(
//   auth('projectManager'),
//   // validateRequest(validation.createHelpMessageValidationSchema),
//   AttachmentController.createAttachment
// );

//[🚧][🧑‍💻✅][🧪🆗] 
router.route('/delete/:attachmentId').delete(
  auth('common'),
  AttachmentController.deleteById
);


export const AttachmentRoutes = router;
