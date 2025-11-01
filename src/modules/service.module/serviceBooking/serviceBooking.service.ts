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

// const serviceProviderService = new ServiceProviderService();

export class ServiceBookingService extends GenericService<
  typeof ServiceBooking,
  IServiceBooking
> {
  constructor() {
    super(ServiceBooking);
  }

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

    /*
    const bookingsWithReviewFlag = await ServiceBooking.aggregate([
      {
        $match: {
          userId: userId,
          isDeleted: { $ne: true }, // optional: exclude soft-deleted
        },
      },
      {
        $lookup: {
          from: 'reviews', // collection name for Review model
          localField: '_id',
          foreignField: 'serviceBookingId',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          hasReview: {
            $gt: [{ $size: '$reviews' }, 0],
          },
        },
      },
      {
        $project: {
          reviews: 0, // exclude the actual reviews array (we only need the flag)
        },
      },
      {
        $sort: { createdAt: -1 }, // optional: sort by newest first
      },
    ]);
    */

    // return bookingsWithReviewFlag;
  }
  

  //---------------------------------------
  // User | Book A Service
  //---------------------------------------
  async createV3(data:ICreateServiceBooking , user: IUser, userTimeZone:string) : Promise<IServiceBooking> {
    
    // check For Provider .. ServiceProvider details exist or not
    const serviceProviderData = await ServiceProvider.findOne({
      providerId: data.providerId
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
  async makePayment(data:Partial<IServiceBooking>, user: IUser) : Promise<any> {

    /********
     * 📝
     * Here first we have to check 
     * ****** */
    

    const existingUser = await User.findById(user.userId);
    

    /*********
     * 📝🥇
     * 1. ++++++ We Create ServiceBooking [status.pending] [PaymentStatus.unpaid] [PaymentTransactionId = null] [PaymentGateway = null]
     * 2. ++ we Provide URL or something to payment .. 
     * -----------------------------------------------------------
     * 6. If Payment Successful .. its going to WEBHOOK 
     * 7. ++++ We create Payment Transaction .. referenceId should be that serviceBookingId, referenceFor should be "ServiceBooking"
     * 7. ++++ We update ServiceBooking [status.completed] [PaymentStatus.paid] [PaymentTransactionId = <transaction_id>] [PaymentGateway = "gateway name"]
     * 
     * ******* */

    const session = await mongoose.startSession();

    let finalAmount = 0;
    let createdBooking = null;

    // session.startTransaction();
    await session.withTransaction(async () => {
        /****
         * TODO :
         * check labTest exist or not 
         * must add session in all db operation inside transaction
         * *** */

        let isBookingExist:IServiceBooking = await ServiceBooking.findById(data._id).session(session);

        if(!isBookingExist){
            throw new ApiError(StatusCodes.NOT_FOUND, "Service Booking not found");
        }

        finalAmount = isBookingExist.startPrice;

        const additionalCosts :IAdditionalCost = await AdditionalCost.find({

        }, { session }); 


        // we dont need to create any booking here .. we can update totalCost 

    });
    session.endSession();
  
  }


}

// metadata: {
//             /*****
//              * 📝 
//              * we receive these data in webhook ..
//              * based on this data .. we have to update our database in webhook ..
//              * also give user a response ..
//              * 
//              * now as our system has multiple feature that related to payment 
//              * so we provide all related data as object and stringify that ..
//              * also provide .. for which category these information we passing ..
//              * 
//              * like we have multiple usecase like
//              * 1. Product Order,
//              * 2. Lab Booking,
//              * 3. Doctor Appointment 
//              * 4. Specialist Workout Class Booking,
//              * 5. Training Program Buying .. 
//              *  
//              * **** */
//             referenceId: createdBooking._id.toString(), // in webhook .. in PaymentTransaction Table .. this should be referenceId
//             referenceFor: TTransactionFor.LabTestBooking, // in webhook .. this should be the referenceFor
//             currency: TCurrency.bdt,
//             amount: finalAmount.toString(),
//             user: JSON.stringify(user) // who created this order  // as we have to send notification also may be need to send email
            
//             /******
//              * 📝
//              * With this information .. first we create a 
//              * PaymentTransaction ..  where paymentStatus[Complete]
//              *  +++++++++++++++++++++ transactionId :: coming from Stripe
//              * ++++++++++++++++++++++ paymentIntent :: coming from stripe .. or we generate this 
//              * ++++++++++++++++++++++ gatewayResponse :: whatever coming from stripe .. we save those for further log
//              * 
//              * We also UPDATE Order Infomation .. 
//              * 
//              * status [ ]
//              * paymentTransactionId [🆔]
//              * paymentStatus [paid]
//              * 
//              * ******* */
//         },
