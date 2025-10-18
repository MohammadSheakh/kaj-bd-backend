import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IServiceProvider {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  providerId: Types.ObjectId; // FK to User
  serviceName: {
    en: string;
    bn: string;
  };
  serviceCategoryId: Types.ObjectId; // FK to ServiceCategory
  starPrice: number;
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

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceProviderModel extends Model<IServiceProvider> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IServiceProvider>>;
}