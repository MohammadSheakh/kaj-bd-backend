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

const serviceProviderService = new ServiceProviderService();

export class ServiceBookingService extends GenericService<
  typeof ServiceBooking,
  IServiceBooking
> {
  constructor() {
    super(ServiceBooking);
  }

  //---------------------------------------
  // User | Book A Service
  //---------------------------------------
  async createV3(data:ICreateServiceBooking , user: IUser, userTimeZone:string) : Promise<IServiceBooking> {
    

    // check For Provider .. ServiceProvider details exist or not
    const serviceProviderData = await serviceProviderService.getById(data.providerId);

    if (!serviceProviderData) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No service provider details found for selected service');
    }

    // Translate multiple properties dynamically
    const [addressObj] : [IServiceBooking['address']]  = await Promise.all([
      buildTranslatedField(data.address as string)
    ]);

    //----------------------------------------------
    // check in this booking time is available or not .. 
    //------------------------------------  we create another endpoint for that 

    const serviceBookingDTO:IServiceBooking = {
      address: addressObj,
      bookingDateTime: new Date(data.bookingDateTime),
      bookingMonth: new Date().getMonth() + 1,
      lat: data.lat,
      long: data.long,
      providerId: data.providerId,
      status : TBookingStatus.pending,
      starPrice: serviceProviderData.startPrice,
      paymentTransactionId : null,
      paymentStatus: TPaymentStatus.unpaid,
      paymentMethod: null,
    }

    const createdServiceBooking : IServiceBooking = await this.model.create(data)

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


    return await this.model.create(data);
  }

  //----------------------------------------
  // User | Make Payment to complete a service .. 
  // This is actually for make payment with surjo pay / ssl commerz Payment Gateway
  // By that we complete a service booking .. 
  //----------------------------------------
  async createV2(data:Partial<IServiceBooking>, user: IUser) : Promise<IServiceBooking> {

    /********
     * 📝
     * Here first we have to check 
     * ****** */
    

    const existingUser = await User.findById(user.userId).select('+subscriptionPlan +stripe_customer_id');
    

    /*********
     * 📝🥇
     * 1. ++++++ We Create LabTestBooking [status.pending] [PaymentStatus.unpaid] [PaymentTransactionId = null]
     * 2. ++ we Provide Stripe URL to payment .. 
     * -----------------------------------------------------------
     * 6. If Payment Successful .. its going to WEBHOOK 
     * 7. ++++ We create Payment Transaction .. referenceId should be that labTestId, referenceFor should be "LabTestBooking"
     * 7. ++++ We update LabTestBooking [status.confirmed] [PaymentStatus.paid] [PaymentTransactionId = <transaction_id>]
     * 
     * ******* */

    let stripeResult ;
    
    try {
    //---------------------------------
    // If stripeCustomerId found .. we dont need to create that .. 
    //---------------------------------   

    let stripeCustomer;
    if(!user.stripe_customer_id){
        let _stripeCustomer = await stripe.customers.create({
            name: user?.userName,
            email: user?.email,
        });
        
        stripeCustomer = _stripeCustomer.id;

        await User.findByIdAndUpdate(user?.userId, { $set: { stripe_customer_id: stripeCustomer.id } });
    }else{
        stripeCustomer = user.stripe_customer_id;
    }

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

        let isLabTestExist:IProduct = await Product.findById(data.labTestId).session(session);

        if(!isLabTestExist){
            throw new ApiError(StatusCodes.NOT_FOUND, "Lab Test not found");
        }

        finalAmount = isLabTestExist.price;

        // now we have to create LabTestBooking
        const bookedLabTest:ILabTestBooking = new LabTestBooking({
            patientId: user?.userId, // logged in user
            labTestId : isLabTestExist._id,
            appointmentDate : data?.appointmentDate,
            startTime: data?.startTime,
            endTime: data?.endTime,
            
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
            
            paymentTransactionId : null,
            paymentStatus : PaymentStatus.unpaid,
            finalAmount: isLabTestExist.price
        })

        createdBooking = await bookedLabTest.save({ session });

    });
    session.endSession();
    
    const stripeSessionData: any = {
        payment_method_types: ['card'],
        mode: 'payment',
        customer: stripeCustomer.id,
        line_items: [
                {
                    price_data: {
                        currency: TCurrency.bdt, // must be small letter
                        product_data: {
                            name: 'Amount',
                        },
                        unit_amount: finalAmount! * 100, // Convert to cents
                    },
                    quantity: 1,
                },
        ],
        metadata: {
            /*****
             * 📝 
             * we receive these data in webhook ..
             * based on this data .. we have to update our database in webhook ..
             * also give user a response ..
             * 
             * now as our system has multiple feature that related to payment 
             * so we provide all related data as object and stringify that ..
             * also provide .. for which category these information we passing ..
             * 
             * like we have multiple usecase like
             * 1. Product Order,
             * 2. Lab Booking,
             * 3. Doctor Appointment 
             * 4. Specialist Workout Class Booking,
             * 5. Training Program Buying .. 
             *  
             * **** */
            referenceId: createdBooking._id.toString(), // in webhook .. in PaymentTransaction Table .. this should be referenceId
            referenceFor: TTransactionFor.LabTestBooking, // in webhook .. this should be the referenceFor
            currency: TCurrency.bdt,
            amount: finalAmount.toString(),
            user: JSON.stringify(user) // who created this order  // as we have to send notification also may be need to send email
            
            /******
             * 📝
             * With this information .. first we create a 
             * PaymentTransaction ..  where paymentStatus[Complete]
             *  +++++++++++++++++++++ transactionId :: coming from Stripe
             * ++++++++++++++++++++++ paymentIntent :: coming from stripe .. or we generate this 
             * ++++++++++++++++++++++ gatewayResponse :: whatever coming from stripe .. we save those for further log
             * 
             * We also UPDATE Order Infomation .. 
             * 
             * status [ ]
             * paymentTransactionId [🆔]
             * paymentStatus [paid]
             * 
             * ******* */
        },
        success_url: config.stripe.success_url,
        cancel_url: config.stripe.cancel_url,
    };


    try {
        const session = await stripe.checkout.sessions.create(stripeSessionData);
        console.log({
                url: session.url,
        });
        stripeResult = { url: session.url };
    } catch (error) {
        console.log({ error });
    }

    } catch (err) {
        console.error("🛑 Error While creating Order", err);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Order creation failed');
    }

    return stripeResult; // result ;//session.url;

  }
}
