import { StatusCodes } from 'http-status-codes';
import { Review } from './review.model';
import { IReview } from './review.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class ReviewService extends GenericService<
  typeof Review,
  IReview
> {
  constructor() {
    super(Review);
  }
}
