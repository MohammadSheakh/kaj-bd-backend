//@ts-ignore
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
import { ServiceProvider } from '../serviceProvider/serviceProvider.model';
//@ts-ignore
import mongoose from 'mongoose';

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

    const result = await Review.aggregate([
      {
        $match: {
          serviceProviderDetailsId: new mongoose.Types.ObjectId(existingBooking.providerDetailsId),
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalRating: { $sum: '$rating' },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    console.log("result-- : ", result);

    if(result.length !== 0){
      const { totalRating, ratingCount } = result[0];

      // console.log('totalRating', totalRating, ' ⚡⚡ ratingCount', ratingCount);
      
      const averageRating = ratingCount > 0 
        ? parseFloat((totalRating / ratingCount).toFixed(2)) 
        : 0;
      
      console.log('averageRating --- ⚡', averageRating);

      await ServiceProvider.findByIdAndUpdate(
        existingBooking.providerDetailsId,
        {
          rating: averageRating,
        }
      )
    }else{
      await ServiceProvider.findByIdAndUpdate(
        existingBooking.providerDetailsId,
        {
          rating: data.rating,
        }
      )
    }

    // 6. Update Booking TODO : MUST : mongo db transaction add korte hobe 
    existingBooking.hasReview = true;
    await existingBooking.save();

    return newReview
  }

}
