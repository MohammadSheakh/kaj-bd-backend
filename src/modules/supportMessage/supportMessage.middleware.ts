//@ts-ignore
import multer from "multer";
import { processUploadedFilesForCreate, processUploadedFilesForUpdate } from "../../middlewares/processUploadedFiles";
import { TFolderName } from "../../enums/folderNames";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//---------------------------
// 🥇 we move image upload thing to controller to middleware level
//---------------------------
export const imageUploadPipelineForCreateSupportMessage = [
  [
    upload.fields([
      { name: 'attachments', maxCount: 5 }, // Allow up to 1 cover photo
    ]),
  ],
  processUploadedFilesForCreate([
    {
      name: 'attachments',
      folder: TFolderName.supportMessage,
      required: true, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // , 'application/pdf'
    },
  ]),
];


export const imageUploadPipelineForUpdateSupportMessage = [
  [
    upload.fields([
      { name: 'attachments', maxCount: 1 }, // Allow up to 1 cover photo
    ]),
  ],
  processUploadedFilesForUpdate([
    {
      name: 'attachments',
      folder: TFolderName.supportMessage,
      required: true, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // , 'application/pdf'
    },
  ]),
];