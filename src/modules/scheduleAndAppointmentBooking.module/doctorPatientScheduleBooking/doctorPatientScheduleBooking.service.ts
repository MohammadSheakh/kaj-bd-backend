//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { DoctorPatientScheduleBooking } from './doctorPatientScheduleBooking.model';
import { IDoctorPatientScheduleBooking } from './doctorPatientScheduleBooking.interface';
import { GenericService } from '../../_generic-module/generic.services';
import { IUser } from '../../token/token.interface';
//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import colors from 'colors';
//@ts-ignore
import Stripe from "stripe";
import stripe from '../../../config/stripe.config';
import { User } from '../../user.module/user/user.model';
import ApiError from '../../../errors/ApiError';
import { config } from '../../../config';
import { TSubscription } from '../../../enums/subscription';
import { TDoctorAppointmentScheduleStatus } from '../doctorAppointmentSchedule/doctorAppointmentSchedule.constant';
import { IDoctorAppointmentSchedule } from '../doctorAppointmentSchedule/doctorAppointmentSchedule.interface';
import { TAppointmentStatus } from './doctorPatientScheduleBooking.constant';
import { TPaymentStatus } from '../specialistPatientScheduleBooking/specialistPatientScheduleBooking.constant';
import { PaymentMethod } from '../../order.module/order/order.constant';
import { TTransactionFor } from '../../payment.module/paymentTransaction/paymentTransaction.constant';
import { DoctorAppointmentSchedule } from '../doctorAppointmentSchedule/doctorAppointmentSchedule.model';
import { DoctorPatient } from '../../personRelationships.module/doctorPatient/doctorPatient.model';
import { scheduleQueue } from '../../../helpers/bullmq/bullmq';
import { logger } from '../../../shared/logger';
import { formatDelay, formatRemainingTime } from '../../../utils/formatDelay';
import { TUser } from '../../user.module/user/user.interface';
import { enqueueWebNotification } from '../../../services/notification.service';
import { TRole } from '../../../middlewares/roles';
import { TNotificationType } from '../../notification/notification.constants';
import { toLocalTime } from '../../../utils/timezone';
import { TRelationCreatedBy } from '../../personRelationships.module/doctorSpecialistPatient/doctorSpecialistPatient.constant';

export class DoctorPatientScheduleBookingService extends GenericService<
  typeof DoctorPatientScheduleBooking,
  IDoctorPatientScheduleBooking> 
  {
    private stripe: Stripe;
    constructor() {
        super(DoctorPatientScheduleBooking);
        this.stripe = stripe;
    }

    async createV2(doctorScheduleId: string, user: IUser) : Promise<IDoctorPatientScheduleBooking | null | { url: any} > 
    {
        /******
         * 📝
         * First We have to check user's subscriptionPlan
         * 1. if "none".. we dont let him to book appointment
         * 2. if "freeTrial" .. need to pay // TODO : need to talk with client about this feature
         * 3. if "standard" or "standardPlus" .. they need to pay to book appointment
         * 4. if "vise" ... no payment required to book appointment
         * ******* */

        const existingUser:TUser = await User.findById(user.userId).select('+subscriptionPlan +stripe_customer_id');
        // TODO : Need to test
        
        if(existingUser.subscriptionType === TSubscription.none){
            throw new ApiError(StatusCodes.FORBIDDEN, 'You need to subscribe a plan to book appointment with doctor');
        }

        const existingSchedule:IDoctorAppointmentSchedule = await DoctorAppointmentSchedule.findOne(
            {
                _id: doctorScheduleId,
               scheduleStatus: TDoctorAppointmentScheduleStatus.available 
            // { $in: [TDoctorAppointmentScheduleStatus.available] } // Check for both pending and scheduled statuses
            }
        );

        if (!existingSchedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Doctor schedule not found');
        }

        /********
         * 📝
         * here we also check if relation ship between doctor and patient exist or not
         *  if not then we create the relationship 
         */
        
        const doctorPatientRelation = await DoctorPatient.findOne({
            doctorId: existingSchedule.createdBy,
            patientId: user.userId
        });

        if (!doctorPatientRelation) {
            // Create the relationship if it doesn't exist
            const newRelation = new DoctorPatient({
                doctorId: existingSchedule.createdBy,
                patientId: user.userId,
                relationCreatedBy : TRelationCreatedBy.purchasingService,
            });
            await newRelation.save();
        }

        existingSchedule.scheduleStatus = TDoctorAppointmentScheduleStatus.booked;
        // existingSchedule.booked_by = user.userId; // we update this in webhook

        if(existingUser.subscriptionType == TSubscription.vise){

            // no payment required ..
            /******
             * 📝
             * check appointment schedule 
             * if scheduleStatus[available]
             * if scheduleDate >= today
             * if timeLeft > 0 // so, we dont think about startTime .. //TODO :
             * ++++++ create doctorPatientScheduleBooking
             * 
             * **** */

            existingSchedule.scheduleStatus = TDoctorAppointmentScheduleStatus.booked;
            existingSchedule.booked_by = user.userId;

            const createdBooking = await this.create({
                patientId: user.userId,
                doctorScheduleId: existingSchedule._id,
                doctorId: existingSchedule.createdBy,// ⚡ this will help us to query easily
                status:  TAppointmentStatus.scheduled,
                paymentTransactionId: null,
                paymentMethod: null,
                paymentStatus: TPaymentStatus.unpaid,

                scheduleDate: existingSchedule.scheduleDate,
                startTime: existingSchedule.startTime,
                endTime: existingSchedule.endTime,
                
                price: parseInt(existingSchedule.price)
            });

            /***
             * TODO : DONE : send notification to doctor and patient
             * ** */

            await existingSchedule.save();

            addToBullQueueToFreeDoctorAppointmentSchedule(existingSchedule, createdBooking);


            /********
             * 
             * Lets send notification to specialist that patient has booked workout class
             * 
             * 🎨 GUIDE FOR FRONTEND 
             *  |-> if doctor click on this notification .. redirect him to upcoming schedule... 
             * ***** */
            await enqueueWebNotification(
                `${existingSchedule.scheduleName} purchased by a ${existingUser.subscriptionType} user ${existingUser.name}`,
                existingUser._id, // senderId
                existingSchedule.createdBy, // receiverId
                TRole.doctor, // receiverRole
                TNotificationType.appointmentBooking, // type
                // '', // linkFor
                // existingTrainingProgram._id // linkId
                // TTransactionFor.TrainingProgramPurchase, // referenceFor
                // purchaseTrainingProgram._id // referenceId
            );


            return  createdBooking;
        }


        /*********
         * 📝
         * 3  ++++++ First Make DoctorAppointmentSchedule [scheduleStatus.booked] after payment done .. we add  [booked_by = patientId]
         * 4. ++++++ We Create DoctorPatientScheduleBooking [status.pending] [PaymentStatus.unpaid] [PaymentTransactionId = null]
         * 5. ++ we Provide Stripe URL to payment .. 
         * -----------------------------------------------------------
         * 6. If Payment Successful .. its going to WEBHOOK 
         * 7. ++++ We create Payment Transaction .. 
         * 7. ++++ We update DoctorPatientScheduleBooking [status.scheduled] [PaymentStatus.paid] [PaymentTransactionId = <transaction_id>]
         * 8. ++++ We update DoctorAppointmentSchedule [booked_by = patientId]
         * 
         * 9. If Payment Failed .. its going to WEBHOOK
         * 10. ++++ We update DoctorPatientScheduleBooking [status.cancelled] [PaymentStatus.failed] [PaymentTransactionId = null] 
         * 11. ++++ We update DoctorAppointmentSchedule [scheduleStatus.available] [booked_by = null]
         * 
         * ******* */

        let stripeResult : { url: string} | null = null;
        
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

            
            let createdDoctorPatientScheduleBooking : IDoctorPatientScheduleBooking | null = null; // we pass this in metadata as referenceId

            // session.startTransaction();
            await session.withTransaction(async () => {
                
                createdDoctorPatientScheduleBooking = await DoctorPatientScheduleBooking.create({
                    patientId: user.userId,  //🔗
                    doctorScheduleId: existingSchedule._id,  //🔗
                    doctorId: existingSchedule.createdBy,//🔗 ⚡ this will help us to query easily
                    status:  TAppointmentStatus.pending, // in webhook -> scheduled.. 
                    price: parseInt(existingSchedule.price),

                    scheduleDate: existingSchedule.scheduleDate,
                    startTime: existingSchedule.startTime,
                    endTime: existingSchedule.endTime,
                

                    paymentTransactionId : null, // in webhook -> we will update this
                    paymentStatus : TPaymentStatus.unpaid, // in webhook -> paid
                    paymentMethod : PaymentMethod.online
                })

                await existingSchedule.save({ session });

                addToBullQueueToFreeDoctorAppointmentSchedule(existingSchedule, createdDoctorPatientScheduleBooking);

            });
            session.endSession();
            
            const stripeSessionData: any = {
                payment_method_types: ['card'],
                mode: 'payment',
                customer: stripeCustomer.id,
                line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: 'Amount',
                                },
                                unit_amount: parseInt(existingSchedule.price)! * 100, // Convert to cents
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
                    referenceId: createdDoctorPatientScheduleBooking._id.toString(), // in webhook .. in PaymentTransaction Table .. this should be referenceId
                    referenceFor: TTransactionFor.DoctorPatientScheduleBooking, // in webhook .. this should be the referenceFor
                    currency: "usd",
                    amount: existingSchedule.price.toString(),
                    user: JSON.stringify(user), // who purchase this  // as we have to send notification also may be need to send email
                    referenceId2 : existingSchedule._id.toString(), // in webhook .. 
                    referenceFor2 : "DoctorAppointmentSchedule", // in webhook ..
                    
                    /******
                     * 📝
                     * With this information .. in webhook first we create a 
                     * PaymentTransaction ..  where paymentStatus[Complete]
                     *  +++++++++++++++++++++ transactionId :: coming from Stripe
                     * ++++++++++++++++++++++ paymentIntent :: coming from stripe .. or we generate this 
                     * ++++++++++++++++++++++ gatewayResponse :: whatever coming from stripe .. we save those for further log
                     * 
                     * We also UPDATE Booking Infomation .. 
                     * 
                     * 7. ++++ We update DoctorPatientScheduleBooking [status.scheduled] [PaymentStatus.paid] [PaymentTransactionId = <transaction_id>]
                     * 8. ++++ We update DoctorAppointmentSchedule [booked_by = patientId]
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
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Order creation failed ${err}`);
    }

    return stripeResult; // result ;//session.url;
    }

    //---------------------------------
    // Doctor | Get All Upcoming Schedule
    //---------------------------------
    async getAllUpcomingSchedule(doctorId: string, userTimeZone: string) {

        console.log("doctorId ::: " , doctorId)

        const schedules = await DoctorPatientScheduleBooking.find({
            doctorId,
            isDeleted: false,
            status: { $in: ["scheduled"] },
        })
        .populate("patientId", "name subscriptionType")
        .populate("doctorScheduleId", "scheduleName description scheduleStatus meetingLink typeOfLink ")

        // scheduleDate startTime endTime 
        .sort({ startTime: 1 });

        const formattedSchedules = schedules.map((s) => ({
            _id: s._id,
            doctorId: s.doctorId,
            doctorSchedule: s.doctorScheduleId,
            patient: s.patientId,
            scheduleDate: s.scheduleDate,
            startTime: toLocalTime(s.startTime, userTimeZone), // s.startTime,
            endTime: toLocalTime(s.endTime, userTimeZone), // s.endTime,
            price: s.price,
            paymentStatus: s.paymentStatus,
            remainingText: formatRemainingTime(s.startTime),
        }));

        return formattedSchedules;
    }
}

/*********
 * we actually expire this one and create a new schedule for next day ..
 * because making the same schedule free for the next day is not good .. it create 
 * complexity
 * ******** */
async function addToBullQueueToFreeDoctorAppointmentSchedule(existingSchedule : IDoctorAppointmentSchedule, createdBooking: IDoctorPatientScheduleBooking){
    // 🥇
    // const endTime = new Date(existingSchedule.endTime); 
    // const delay = endTime.getTime() - Date.now();
    

    // 🔍 DEBUG: Let's see what we're actually working with
    // console.log("🔍 Raw existingSchedule.endTime:", existingSchedule.endTime);
    // console.log("🔍 typeof existingSchedule.endTime:", typeof existingSchedule.endTime);
    // console.log("🔍 existingSchedule.endTime.constructor.name:", existingSchedule.endTime?.constructor?.name);
    
    const endTime = new Date(existingSchedule.endTime);
    
    // console.log("🔍 Parsed endTime:", endTime);
    // console.log("🔍 endTime.toISOString():", endTime.toISOString());
    // console.log("🔍 endTime.getTime():", endTime.getTime());
    
    const now = Date.now();
    // console.log("🔍 Current time (Date.now()):", now);
    // console.log("🔍 Current time as Date:", new Date(now).toISOString());
    
    const delay = endTime.getTime() - now;
    // console.log("🔍 Calculated delay (ms):", delay);
    // console.log("🔍 Calculated delay (minutes):", delay / 1000 / 60);
    
    // Original logging
    // console.log('👉 schedule booking time : ', now) 
    // console.log("👉 Scheduling job to free up schedule at : ", endTime , " ⚡ ",  endTime.getTime()); 
    // console.log("👉 delay :", delay); 


    if (delay > 0) {
        await scheduleQueue.add(
            "makeDoctorAppointmentScheduleAvailable",
            { 
                scheduleId: existingSchedule._id,
                appointmentBookingId : createdBooking._id,
            },
            { delay }
        );
        /*************
            Retries & Backoff

            Currently if a job fails, it just logs.

            You should configure retries (e.g. 3–5 retries with exponential backoff).
            {
                attempts: 5, // retry 5 times
                backoff: { type: "exponential", delay: 5000 }, // 5s, 10s, 20s...
                removeOnComplete: true,
                removeOnFail: false, // keep failed jobs for inspection
            }
        ********** */

        // ${delay / 1000}s -> 
        console.log(`⏰ Job added to free schedule ${existingSchedule._id} in ${formatDelay(delay)}`);
        logger.info(colors.green(`⏰ Job added to free schedule ${existingSchedule._id} in ${formatDelay(delay)}`));
    }
}