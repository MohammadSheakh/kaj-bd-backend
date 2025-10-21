//@ts-ignore
import { Request, Response, NextFunction } from 'express';
import { processFilesV2 } from '../helpers/processFilesToUpload';
import { FileFieldConfig } from '../modules/attachments/attachment.interface';

type UploadedFiles = Record<string, string[]>;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      uploadedFiles?: UploadedFiles;
    }
  }
}

/**
 * Process uploaded files from Express request
 * 
 * This middleware processes the uploaded files from Express request,
 * validates the file types, and stores the uploaded file URLs
 * in the request object.
 * 
 * @param {FileFieldConfig[]} configs - An array of file field configurations
 * @returns {(req: Request, res: Response, next: NextFunction) => Promise<void>} - The middleware function
 */
//-------------------------------------
// middleware 
//-------------------------------------
export const processUploadedFilesForCreate = (configs: FileFieldConfig[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadedFiles: UploadedFiles = {};

      for (const config of configs) {
        const files = req.files?.[config.name] as Express.Multer.File[] | undefined;

        // ✅ 1. Required field check
        if (config.required && (!files || files.length === 0)) {
          throw new Error(`Missing required file field: ${config.name}`);
        }

        // ✅ 2. MIME type validation
        if (config.allowedMimeTypes && files?.length) {
          const invalid = files.some(
            (f) => !config.allowedMimeTypes!.includes(f.mimetype)
          );
          if (invalid) {
            throw new Error(`Invalid file type for field: ${config.name}`);
          }
        }

        // ✅ 3. Process (upload) files
        uploadedFiles[config.name] = await processFilesV2(files, config.folder);
        //--------------------------------
        // 📝🥇🔁 assign file urls in req.body[specific property name] directly 
        // so that we can pass this to controller to pass to service to save in DB
        // and in controller we dont have to do these upload things
        //--------------------------------

        // console.log("uploadedFiles[config.name] -> ", uploadedFiles[config.name])

        req.body[config.name] = uploadedFiles[config.name];
      }

      req.uploadedFiles = uploadedFiles;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const processUploadedFilesForUpdate = (configs: FileFieldConfig[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadedFiles: UploadedFiles = {};

      for (const config of configs) {
        const files = req.files?.[config.name] as Express.Multer.File[] | undefined;

        // ✅ 1. Required field check
        if (config.required && (!files || files.length === 0)) {
          throw new Error(`Missing required file field: ${config.name}`);
        }

        // ✅ 2. MIME type validation
        if (config.allowedMimeTypes && files?.length) {
          const invalid = files.some(
            (f) => !config.allowedMimeTypes!.includes(f.mimetype)
          );
          if (invalid) {
            throw new Error(`Invalid file type for field: ${config.name}`);
          }
        }

        // ✅ 3. Process (upload) files
        uploadedFiles[config.name] = await processFilesV2(files, config.folder);
        //--------------------------------
        // 📝🥇🔁 
        // as this middleware for update route now .. we do the 
        // upload things based on condition .. if image uploaded then 
        // we use that uploaded image url otherwise we use previous one
        //
        //--------------------------------
        // req.body[config.name] = uploadedFiles[config.name];
      }

      console.log("uploadedFiles: ", uploadedFiles);

      req.uploadedFiles = uploadedFiles;
      next();
    } catch (error) {
      next(error);
    }
  };
};

