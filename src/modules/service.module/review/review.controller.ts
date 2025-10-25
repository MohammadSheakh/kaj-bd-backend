//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { Review } from './review.model';
import { ICreateReview, IReview } from './review.interface';
import { ReviewService } from './review.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { detectLanguage } from '../../../utils/detectLanguageByFranc';
import { User } from '../../user.module/user/user.model';
import { translateTextToTargetLang } from '../../../utils/translateTextToTargetLang';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';


export class ReviewController extends GenericController<
  typeof Review,
  IReview
> {
  reviewService = new ReviewService();

  constructor() {
    super(new ReviewService(), 'Review');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateReview = req.body;

    const result = await this.reviewService.createV2(data, req.user.userId);
    
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
