//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { Review } from './review.model';
import { IReview } from './review.interface';
import { ReviewService } from './review.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { detectLanguage } from '../../../utils/detectLanguageByFranc';
import { User } from '../../user.module/user/user.model';
import { translateTextToTargetLang } from '../../../utils/translateTextToTargetLang';

interface ICreateReview{
  review: string, // TODO : add more fields .. 
}

export class ReviewController extends GenericController<
  typeof Review,
  IReview
> {
  ReviewService = new ReviewService();

  constructor() {
    super(new ReviewService(), 'Review');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateReview = req.body;
    
    const cleanText = data.review.trim();
    if (cleanText.length < 3) {
      // too short → use user.language
    }

    // 🔍 Detect actual language of the review text
    let detectedLang = detectLanguage(data.review);
    const originalLang = detectedLang || 'en'; // fallback

    // Fallback: if unknown, use user's profile language
    if (detectedLang === 'unknown') {
      const user = await User.findById(req.user.userId);
      detectedLang = user?.language || 'en';
    }

    const reviewObj = {
      en: '',
      bn: ''
    };


    // 3. Set original
    reviewObj[originalLang] = cleanText;

    // 4. Translate to the other language
    const otherLang = originalLang === 'en' ? 'bn' : 'en';
    reviewObj[otherLang] = await translateTextToTargetLang(
      data.review,
      otherLang
    );

    // 5. Save to DB
    const newReview = new Review({
      review: reviewObj,
      originalLanguage: originalLang,
      rating,
      userId,
      serviceProviderId,
      serviceBookingId,
    });
    

    await newReview.save();



    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
