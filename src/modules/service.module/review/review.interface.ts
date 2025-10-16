import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TLanguage } from '../../../enums/language';


export interface IReview {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  
  // review: string;
  review: {
    en: string;
    bn: string;
  };
  originalLanguage: TLanguage.en | TLanguage.bn;

  rating: number;

  userId: Types.ObjectId;               // FK → User
  serviceProviderId: Types.ObjectId;    // FK → User // need to think about this 
  serviceBookingId: Types.ObjectId;     // FK → ServiceBooking

  isDeleted? : boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReviewModel extends Model<IReview> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IReview>>;
}



