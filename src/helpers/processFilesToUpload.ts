import { TFolderName } from "../enums/folderNames";
import { AttachmentService } from "../modules/attachments/attachment.service";
//@ts-ignore
import { Types } from 'mongoose';
//@ts-ignore
import { Express } from 'express';

//----------------------------------
// basic function to upload files to AWS 
// which we call from controller ..
// -- but now we want to do it in router level .. 💎✨🔍 -> V2 Found
//----------------------------------
export async function processFiles(files: any[], folderName: TFolderName): Promise<Types.ObjectId[]> {
    if (!files || files.length === 0) return [];

    // All files upload in parallel
    const uploadPromises = files.map(file => 
        new AttachmentService().uploadSingleAttachment(file, folderName)
    );

    return await Promise.all(uploadPromises);
}

/**
 * Process files to upload in parallel
 * @param {Express.Multer.File[]} files - Array of files to upload
 * @param {TFolderName} folderName - Name of the folder to upload files to
 * @returns {Promise<string[]>} - Array of uploaded file URLs
 */
//-------------------------------------
// helpers
//-------------------------------------
export const processFilesV2 = async (
  files?: Express.Multer.File[],
  folderName?: TFolderName 
): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  // Example: upload each file (can be Cloudinary, S3, or local storage)
  const uploadedUrls = await Promise.all(
    files.map(async (file) => {
      const uploadedUrl = await new AttachmentService().uploadSingleAttachment(file, folderName as TFolderName)
      //uploadToCloudOrLocal(file, folderName);
      return uploadedUrl;
    })
  );

  return uploadedUrls;
};



