//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { Roles } from '../../middlewares/roles';
import {AttachmentType } from './attachment.constant';
import { TFolderName } from '../../enums/folderNames';

// FIX  // TODO : joto jaygay role ase .. role gula check dite hobe .. 
export interface IAttachment {
  _id?: Types.ObjectId;
  attachment: string;
  attachmentType: AttachmentType.image | AttachmentType.document 
   | AttachmentType.unknown | AttachmentType.video;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttachmentModel extends Model<IAttachment> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IAttachment>>;
}

//-----------------------------------------
// we use this into uploadedFiles middleware 
//-----------------------------------------
export interface FileFieldConfig {
  /** name of the field (must match multer field name) */
  name: string;

  /** where to store in your cloud/local folder enum */
  folder: TFolderName;

  /** mark if this field must exist */
  required?: boolean;

  /** restrict upload count */
  maxCount?: number;

  /** restrict file types */
  allowedMimeTypes?: string[];
}
