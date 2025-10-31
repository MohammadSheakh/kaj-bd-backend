import { StatusCodes } from 'http-status-codes';
import { Review } from './review.model';
import { ICreateReview, IReview } from './review.interface';
import { GenericService } from '../../_generic-module/generic.services';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';
import { detectLanguage } from '../../../utils/detectLanguageByFranc';
import { ServiceBooking } from '../serviceBooking/serviceBooking.model';
import { IServiceBooking } from '../serviceBooking/serviceBooking.interface';
import { TBookingStatus } from '../serviceBooking/serviceBooking.constant';
import { TLanguage } from '../../../enums/language';

export class ReviewService extends GenericService<
  typeof Review,
  IReview
> {
  constructor() {
    super(Review);
  }


  async createV2(data:ICreateReview, userId: string) : Promise<IReview> {
    // Translate multiple properties dynamically
    const [reviewObj] : [IReview['review']]  = await Promise.all([
      buildTranslatedField(data.review as string)
    ]);
    
    // let originalLanguage = await detectLanguage(data.review); // TODO : MUST .. uncomment this line to detect original language

    const existingBooking:IServiceBooking = await ServiceBooking.findById(data.serviceBookingId);
    
    if(!existingBooking) {
      throw new Error('Invalid Booking Id');
    }

    if(existingBooking.status !== TBookingStatus.completed){
      throw new Error('Booking is not completed yet.. So you can not give review');
    } 

    // 5. Save to DB
    const newReview = new Review({
      review: reviewObj,
      originalLanguage: TLanguage.en, //originalLanguage,
      rating : data.rating,
      userId : userId,
      serviceProviderDetailsId : existingBooking.providerDetailsId,
      serviceBookingId: data.serviceBookingId,
    });
    
    await newReview.save();

    return newReview
  }

}
