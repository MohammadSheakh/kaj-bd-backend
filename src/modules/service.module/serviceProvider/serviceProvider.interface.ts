//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TProviderApprovalStatus } from '../../user.module/userRoleData/userRoleData.constant';

//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
export interface IServiceProvider {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  providerId: Types.ObjectId; // FK to User
  serviceName: {
    en: string;
    bn: string;
  };
  serviceCategoryId: Types.ObjectId; // FK to ServiceCategory
  startPrice: number;
  rating: number;
  introOrBio?: {
    en: string;
    bn: string;
  };
  description?: {
    en: string;
    bn: string;
  };
  attachmentsForGallery: Types.ObjectId[]; //🔗🖼️ 
  attachmentsForCoverPhoto?: Types.ObjectId[]; //🔗🖼️  Optional: if you want to store the cover photo separately
  yearsOfExperience: number;
  providerApprovalStatus?: TProviderApprovalStatus; //🧩

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}


export interface ICreateServiceProvider{
  serviceCategoryId:Types.ObjectId;   

  categoryCustomName : string;

  serviceName : string | IServiceProvider['serviceName']
  yearsOfExperience : number
  startPrice : number
  frontSideCertificateImage : string // from processUploadedFilesForCreate middleware
  backSideCertificateImage : string // from processUploadedFilesForCreate middleware

  providerId : Types.ObjectId // logged in userId
}

export interface ICreateServiceProviderDTO{
  serviceCategoryId:Types.ObjectId  
  serviceName : string | IServiceProvider['serviceName']
  yearsOfExperience : number
  startPrice : number
  providerId : Types.ObjectId // logged in userId
}

export interface IUpdateProfileDTO{
  frontSideCertificateImage : string // from processUploadedFilesForCreate middleware
  backSideCertificateImage : string // from processUploadedFilesForCreate middleware
  faceImageFromFrontCam : string // from processUploadedFilesForCreate middleware
}

export interface IUploadAttachmentsForGalleryDTO{
  attachmentsForGallery : string // from imageUploadPipelineForUpdateAttachmentsOfServiceProvider middleware
}

export interface IUploadAttachmentsForGalleryDTOV2{
  attachmentsForGallery : string[] // from imageUploadPipelineForUpdateAttachmentsOfServiceProvider middleware
  serviceName : string | IServiceProvider['serviceName']
  yearsOfExperience : number
  startPrice : number
  providerId : Types.ObjectId // logged in userId
  description : string | IServiceProvider['description']
}

export interface IServiceProviderModel extends Model<IServiceProvider> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IServiceProvider>>;
}