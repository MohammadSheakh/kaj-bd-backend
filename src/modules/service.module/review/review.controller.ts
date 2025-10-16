import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../_generic-module/generic.controller';
import { Review } from './Review.model';
import { IReview } from './Review.interface';
import { ReviewService } from './Review.service';

export class ReviewController extends GenericController<
  typeof Review,
  IReview
> {
  ReviewService = new ReviewService();

  constructor() {
    super(new ReviewService(), 'Review');
  }

  // add more methods here if needed or override the existing ones 
}
