//@ts-ignore
import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';


export interface ISpecialistPatient {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  patientId: Types.ObjectId;
  specialistId : Types.ObjectId;
  relationCreatedBy : any;

  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISpecialistPatientModel extends Model<ISpecialistPatient> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ISpecialistPatient>>;
}