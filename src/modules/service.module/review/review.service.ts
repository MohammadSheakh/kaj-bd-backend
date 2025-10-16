import { StatusCodes } from 'http-status-codes';
import { Review } from './Review.model';
import { IReview } from './Review.interface';
import { GenericService } from '../_generic-module/generic.services';


export class ReviewService extends GenericService<
  typeof Review,
  IReview
> {
  constructor() {
    super(Review);
  }
}
