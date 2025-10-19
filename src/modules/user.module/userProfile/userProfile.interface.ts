//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TGender } from './userProfile.constant';

export interface IUserProfile {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  frontSideCertificateImage: Types.ObjectId[]; 
  backSideCertificateImage: Types.ObjectId[]; 
  faceImageFromFrontCam: Types.ObjectId[]; 
  gender : TGender.male |
              TGender.female;

  acceptTOC : boolean;
  userId: Types.ObjectId; // for back reference ..
  location: {
    en: string;
    bn: string;
  };
  lat: number;
  lng: number;
  dob : Date;
  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserProfileModel extends Model<IUserProfile> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IUserProfile>>;
}