//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TRole } from '../../../middlewares/roles';

export interface IServiceCategory {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  attachments?: string[]; //🔗🖼️ only 1 can be used for icon
  // name: string;
  name: {
    en: string;
    bn: string;
  };
  createdBy:  TRole.admin | TRole.provider;
  createdByUserId?: Types.ObjectId | null;
  isVisible?: boolean;

  isDeleted? : boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateServiceCategory{
  attachments?: string[];
  name: string | IServiceCategory['name'] // TODO : add more fields ..
  createdBy : IServiceCategory['createdBy'] 
}

export interface IUpdateServiceCategory{
  attachments?: string[];
  name: string | IServiceCategory['name'] ;
  isVisible : boolean
}

export interface IServiceCategoryModel extends Model<IServiceCategory> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IServiceCategory>>;
}