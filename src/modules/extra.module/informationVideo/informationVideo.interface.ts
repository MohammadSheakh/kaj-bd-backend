//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';


export interface IinformationVideo {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  thumbnail?: Types.ObjectId[];
  video?: Types.ObjectId[];
  videoLink : String;

  title: String;
  description: String;
  createdBy : Types.ObjectId; //🔗 specialistId
  quantity : Number;

  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date; 
}

export interface IinformationVideoModel extends Model<IinformationVideo> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IinformationVideo>>;
}