import { TFolderName } from "../../../enums/folderNames";
//@ts-ignore
import multer from "multer";
import { processUploadedFilesForCreate, processUploadedFilesForUpdate } from "../../../middlewares/processUploadedFiles";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------

//---------------------------
// 🥇 we move image upload thing to controller to middleware level
//---------------------------
export const imageUploadPipelineForCreateServiceProviderInformation = [
  [
    upload.fields([
      { name: 'frontSideCertificateImage', maxCount: 1 }, // Allow up to 1 cover photo
      { name: 'backSideCertificateImage', maxCount: 1 }, // Allow up to 1 trailer video
      { name: 'faceImageFromFrontCam', maxCount: 1 }, // Allow up to 1 trailer video      
    ]),
  ],
  processUploadedFilesForCreate([
    {
      name: 'frontSideCertificateImage',
      folder: TFolderName.trainingProgram,
      required: true, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // , 'application/pdf'
    },
    {
      name: 'backSideCertificateImage',
      folder: TFolderName.trainingProgram,
      required: true, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // 'video/mp4', 'video/mov'
    },
    {
      name: 'faceImageFromFrontCam',
      folder: TFolderName.trainingProgram,
      required: true, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // 'video/mp4', 'video/mov'
    },
  ]),
];

//---------------------------
// 🥇 we move image upload thing to controller to middleware level
//---------------------------
export const imageUploadPipelineForUpdateAttachmentsOfServiceProvider = [
  [
    upload.fields([
      { name: 'attachmentsForGallery', maxCount: 10 }, // Allow up to 1 cover photo
    ]),
  ],
  processUploadedFilesForUpdate([
    {
      name: 'attachmentsForGallery',
      folder: TFolderName.serviceProviderDetails,
      required: false, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // , 'application/pdf'
    }
  ]),
];



