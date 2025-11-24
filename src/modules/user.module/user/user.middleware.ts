import { TFolderName } from "../../../enums/folderNames";
//@ts-ignore
import multer from "multer";
import { processUploadedFilesForCreate, processUploadedFilesForUpdate } from "../../../middlewares/processUploadedFiles";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//---------------------------
// 🥇 we move image upload thing to controller to middleware level
//---------------------------
export const imageUploadPipelineForUpdateUserProfile = [
  [
    upload.fields([
      { name: 'profileImage', maxCount: 1 }, // Allow up to 1 
    ]),
  ],
  processUploadedFilesForUpdate([
    {
      name: 'profileImage',
      folder: TFolderName.user,
      required: false, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // optional
    },
  ]),
];

