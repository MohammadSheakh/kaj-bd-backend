//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ServiceBooking } from './serviceBooking.model';
import { ICreateServiceBooking, IServiceBooking } from './serviceBooking.interface';
import { GenericService } from '../../_generic-module/generic.services';
import ApiError from '../../../errors/ApiError';
import { User } from '../../user.module/user/user.model';
import { TCurrency } from '../../../enums/payment';
import { IUser } from '../../token/token.interface';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';
import { TBookingStatus, TPaymentStatus } from './serviceBooking.constant';
import { ServiceProvider } from '../serviceProvider/serviceProvider.model';
import { ServiceProviderService } from '../serviceProvider/serviceProvider.service';
import { enqueueWebNotification } from '../../../services/notification.service';
import { TRole } from '../../../middlewares/roles';
import { TNotificationType } from '../../notification/notification.constants';
import { toUTCTime } from '../../../utils/timezone';
import PaginationService from '../../../common/service/paginationService';
//@ts-ignore
import mongoose from 'mongoose';
import { UserProvider } from '../../userProvider/userProvider.model';
import { IAdditionalCost } from '../additionalCost/additionalCost.interface';
import { AdditionalCost } from '../additionalCost/additionalCost.model';
import { AdminPercentage } from '../../adminPercentage/adminPercentage.model';
import { IAdminPercentage } from '../../adminPercentage/adminPercentage.interface';

// const serviceProviderService = new ServiceProviderService();

export class ServiceBookingService extends GenericService<
  typeof ServiceBooking,
  IServiceBooking
> {
  constructor() {
    super(ServiceBooking);
  }

  // bookingsWithReviewFlag
  async getAllCompletedBookings(userId: string,
    filters : any,
    options :any
  ) {

    //📈⚙️ OPTIMIZATION: 
    const pipeline = [

    ]

    const res = await PaginationService.aggregationPaginate(
      ServiceBooking,
      pipeline, {
        limit: options.limit,
        page: options.page
      }
    );

    console.log('res: ', res);

    return res


    // return bookingsWithReviewFlag;
  }


  async getWithAdditionalCosts(bookingId, loggedInUserId){
    

    return {
      serviceBooking,
      additionalCosts
    }
  }
  

  //---------------------------------------
  // User | Book A Service
  //---------------------------------------
  async createV3(data:ICreateServiceBooking , user: IUser, userTimeZone:string) : Promise<IServiceBooking> {
    
    // check For Provider .. ServiceProvider details exist or not
    const serviceProviderData = await ServiceProvider.findOne({
      providerId: data.providerId
    });

    const adminPercentage:IAdminPercentage = await AdminPercentage.findOne({
      isDeleted: false,
    });

    if (!serviceProviderData) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No service provider details found for selected service');
    }

    /********
     * 📝
     * 
     * ****** */
    if(data.bookingDateTime) {
        const scheduleDate = new Date(data.bookingDateTime);
        
        data.bookingDateTime = toUTCTime(data.bookingDateTime, userTimeZone);

        if(isNaN(scheduleDate.getTime())) {
            throw new Error('Invalid date or time format');
        }

        const now = new Date();
        if(data.bookingDateTime < now) {
            throw new Error('Booking Date Time must be in the future');
        }

        // Check for overlapping schedules for the same providers schedule
        const overlappingSchedule = await ServiceBooking.findOne({
            providerId: data.providerId,
            bookingDateTime: scheduleDate,
        });

        if(overlappingSchedule) {
            throw new Error('Overlapping schedule exists for the provider. ');
        }
    }

    // Translate multiple properties dynamically
    const [addressObj] : [IServiceBooking['address']]  = await Promise.all([
      buildTranslatedField(data.address as string)
    ]);

    //----------------------------------------------
    // check in this booking time is available or not .. 
    //------------------------------------  we create another endpoint for that 

  
    //⚠️ TODO : need Interface Segregation Principle (ISP)
    const serviceBookingDTO:IServiceBooking = {
      address: addressObj,
      bookingDateTime: new Date(data.bookingDateTime),
      bookingMonth: new Date().getMonth() + 1,
      lat: data.lat,
      long: data.long,
      providerId: data.providerId,
      userId : user.userId,
      providerDetailsId : serviceProviderData._id,
      status : TBookingStatus.pending,
      startPrice: serviceProviderData.startPrice,
      paymentTransactionId : null,
      paymentStatus: TPaymentStatus.unpaid,
      paymentMethod: null,
      adminPercentageOfStartPrice: serviceProviderData.startPrice * (parseInt(adminPercentage?.percentage) / 100)
    }

    console.log('serviceBookingDTO', serviceBookingDTO);

    const createdServiceBooking : IServiceBooking = await ServiceBooking.create(serviceBookingDTO); 

    /**
     * Lets create userProviderRelationships .. 
     * later we need to create this relationship with bull mq or event emitter
     * for better performance
     */
    const relationshipExists = await UserProvider.findOne({
      userId: user.userId,
      providerId: data.providerId
    });

    if(!relationshipExists) {
      await UserProvider.create({
        userId: user.userId,
        providerId: data.providerId
      });
    }

    /**********
     * 🥇
     * Lets send notification to provider that a user has booked a service
     * TODO : MUST : address e language er chinta korte hobe 
     * ******* */
    await enqueueWebNotification(
      `${user.userName} booked your service at ${serviceBookingDTO.bookingDateTime} in ${serviceBookingDTO.address}.`,
      user.userId, // senderId
      serviceBookingDTO.providerId, // receiverId
      TRole.provider, // receiverRole
      TNotificationType.serviceBooking, // type
      createdServiceBooking._id, // idOfType
      null, // linkFor // queryParamKey
      null, // linkId // queryParamValue
    );


    return createdServiceBooking;
  }

  //----------------------------------------
  // User | Make Payment to complete a service .. 
  // This is actually for make payment with surjo pay / ssl commerz Payment Gateway
  // By that we complete a service booking .. 
  // TODO : change this Partial<IServiceBooking> and add actual Interface 
  //----------------------------------------
  
  // we use processPayment of sslcommerz.gateway.ts ----------------- -------------- -------------- -------------



}

