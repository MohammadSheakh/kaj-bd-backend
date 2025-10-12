//@ts-ignore
import { Queue, Worker, QueueScheduler, Job } from "bullmq"; 
import { DoctorAppointmentSchedule } from "../../modules/scheduleAndAppointmentBooking.module/doctorAppointmentSchedule/doctorAppointmentSchedule.model";
import { TDoctorAppointmentScheduleStatus } from "../../modules/scheduleAndAppointmentBooking.module/doctorAppointmentSchedule/doctorAppointmentSchedule.constant";
import { errorLogger, logger } from "../../shared/logger";
import { DoctorPatientScheduleBooking } from "../../modules/scheduleAndAppointmentBooking.module/doctorPatientScheduleBooking/doctorPatientScheduleBooking.model";
import { TAppointmentStatus } from "../../modules/scheduleAndAppointmentBooking.module/doctorPatientScheduleBooking/doctorPatientScheduleBooking.constant";
import { SpecialistWorkoutClassSchedule } from "../../modules/scheduleAndAppointmentBooking.module/specialistWorkoutClassSchedule/specialistWorkoutClassSchedule.model";
import { TSpecialistWorkoutClassSchedule } from "../../modules/scheduleAndAppointmentBooking.module/specialistWorkoutClassSchedule/specialistWorkoutClassSchedule.constant";
import { SpecialistPatientScheduleBooking } from "../../modules/scheduleAndAppointmentBooking.module/specialistPatientScheduleBooking/specialistPatientScheduleBooking.model";
import { TScheduleBookingStatus } from "../../modules/scheduleAndAppointmentBooking.module/specialistPatientScheduleBooking/specialistPatientScheduleBooking.constant";
import { IDoctorAppointmentSchedule } from "../../modules/scheduleAndAppointmentBooking.module/doctorAppointmentSchedule/doctorAppointmentSchedule.interface";
import { Notification } from "../../modules/notification/notification.model";
import { INotification } from "../../modules/notification/notification.interface";
import { redisPubClient } from "../redis/redis";
import { socketService } from "../socket/socketForChatV3";
import { TRole } from "../../middlewares/roles";

// Create Queue
export const scheduleQueue = new Queue("scheduleQueue", {
  connection: redisPubClient.options, // reuse your redis config
});

//---------------------------------
// If you’re on v5.x or later, QueueScheduler was removed. The functionality is built into Worker now, 
// so you don’t need to use QueueScheduler.
//---------------------------------

// new QueueScheduler("scheduleQueue", {
//   connection: redisPubClient.options,
// });

interface IScheduleJob {
  name: string;
  data :{
    scheduleId: string; // doctorAppointmentSchedule
    appointmentBookingId:string; // doctorAppointmentBooking
  },
  id: string
}


// 🔎 search for  addToBullQueueToFreeDoctorAppointmentSchedule to see details 

// Create Worker for scheduleQueue
export const startScheduleWorker = () => {
  const worker = new Worker(
    "scheduleQueue",
    async (job:IScheduleJob) => {
      // TODO : add try catch 

      console.log(`Processing job ${job.id} of type ${job.name}⚡${job.data}`);
      logger.info('Processing job', job.name, " ⚡ ", job.data);

      if (job.name === "makeDoctorAppointmentScheduleAvailable") {

        console.log("🔎🔎🔎🔎 makeDoctorAppointmentScheduleAvailable ")
        const { scheduleId, appointmentBookingId } = job.data;

        const tomorrow = new Date();
        // const timeForTomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // reset to midnight
        // timeForTomorrow.setUTCDate(timeForTomorrow.getUTCDate() + 1);

        /*****
         * 📝
         * For start Time and endTime .. we only manupulate date thing .. not time .. 
         * 
         * its not possible to update the same schedule with new time .. because its create 
         * complexity in further booking for same person 
         * 
         * so .. solution is to create a new schedule with new date and time
         * and update the old one as expired 
         * 
         * TODO: 
         * later we can create a cron job to delete all expired schedule after 7 days or so
         * 
         * *** */
        
        const updatedSchedule:IDoctorAppointmentSchedule = await DoctorAppointmentSchedule.findByIdAndUpdate(scheduleId, {
          $set: { 
            scheduleStatus: 
            // TDoctorAppointmentScheduleStatus.available,
            TDoctorAppointmentScheduleStatus.expired,
            booked_by: null,
            // scheduleDate: tomorrow,
            // startTime: timeForTomorrow,
            // endTime: timeForTomorrow,
          }
        });

        console.log("updatedSchedule.startTime :: ", updatedSchedule.startTime)
        console.log("updatedSchedule.endTime :: ", updatedSchedule.endTime)

         // 🔹 Step 3: Preserve original time-of-day from startTime & endTime
        const originalStart = new Date(updatedSchedule.startTime);
        const originalEnd = new Date(updatedSchedule.endTime);

        // Create new startTime: tomorrow + original start time (hours, minutes, seconds)
        const newStartTime = new Date(tomorrow);
        newStartTime.setHours(
          originalStart.getHours(),
          originalStart.getMinutes(),
          originalStart.getSeconds(),
          originalStart.getMilliseconds()
        );

        // Create new endTime: tomorrow + original end time
        const newEndTime = new Date(tomorrow);
        newEndTime.setHours(
          originalEnd.getHours(),
          originalEnd.getMinutes(),
          originalEnd.getSeconds(),
          originalEnd.getMilliseconds()
        );

        console.log("newStartTime :: ", newStartTime)
        console.log("newEndTime :: ", newEndTime)

        /****
         * lets create another 
         * ** */

        updatedSchedule && await DoctorAppointmentSchedule.create({
          createdBy: updatedSchedule.createdBy,
          scheduleName: updatedSchedule.scheduleName,
          scheduleDate: tomorrow,
          startTime: newStartTime,
          endTime: newEndTime,

          description: updatedSchedule.description,
          price: updatedSchedule.price,
          typeOfLink: updatedSchedule.typeOfLink,
          meetingLink: updatedSchedule.meetingLink,
          scheduleStatus: TDoctorAppointmentScheduleStatus.available,
        });

        await DoctorPatientScheduleBooking.findByIdAndUpdate(appointmentBookingId, {
          $set: {
            status: TAppointmentStatus.completed,
          }
        });

        console.log(`✅ Schedule ${scheduleId} automatically freed.`);
      }else if (job.name === "expireDoctorAppointmentScheduleAfterEndTime") {

        console.log("🔎🔎🔎🔎 expireDoctorAppointmentScheduleAfterEndTime ")
        const { scheduleId } = job.data;

        /*****
         * 📝
         * 
         * TODO: 
         * later we can create a cron job to delete all expired schedule after 7 days or so
         * 
         * *** */
        
        const updatedSchedule:IDoctorAppointmentSchedule = await DoctorAppointmentSchedule.findByIdAndUpdate(scheduleId, {
          $set: { 
            scheduleStatus: 
            // TDoctorAppointmentScheduleStatus.available,
            TDoctorAppointmentScheduleStatus.expired,
            booked_by: null,
          }
        });

        console.log(`✅ Schedule ${scheduleId} automatically expired at ${new Date().toLocaleString()}.`);
      }else if (job.name === "makeSpecialistWorkoutClassScheduleAvailable") {
        console.log("🔎🔎🔎🔎 makeSpecialistWorkoutClassScheduleAvailable ")
        const { scheduleId } = job.data; 
        /***
         * we dont need booking id here as multiple patient can book a workout class
         * we will update all the booking status to completed where workoutClassScheduleId = scheduleId
         *
         ** */


        // Fetch schedule first
        const schedule = await SpecialistWorkoutClassSchedule.findById(scheduleId);

        // ✅ If schedule is already available, exit early
        if (!schedule) {
          console.log(`⚠️ Schedule ${scheduleId} not found.`);
          return;
        }

        if (schedule.status === TSpecialistWorkoutClassSchedule.available) {
          console.log(`⏩ Schedule ${scheduleId} is already available. Skipping job.`);
          return;
        }

        const tomorrow = new Date();
        const timeForTomorrow = new Date()
        
        // TODO : need to think about timezone⏳⌛ here
        // tomorrow.setDate(tomorrow.getDate() + 1);
        // tomorrow.setHours(0, 0, 0, 0); // reset to midnight


        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        timeForTomorrow.setUTCDate(timeForTomorrow.getUTCDate() + 1);

        tomorrow.setUTCHours(0, 0, 0, 0);



        await SpecialistWorkoutClassSchedule.findByIdAndUpdate(scheduleId, {
          $set: { 
              status:  TSpecialistWorkoutClassSchedule.expired,
              // TSpecialistWorkoutClassSchedule.available,
              // scheduleDate: tomorrow,
              // startTime: timeForTomorrow,
              // endTime: timeForTomorrow,
          }
        });

        /******
         * need to think about this part .. do we need to create a new schedule for next day ?
         * *** */

        /*****
         * 
         * we need batch update here .. as multiple patient can book a workout class
         *
         ****** */
        await SpecialistPatientScheduleBooking.updateMany(
          { workoutClassScheduleId: scheduleId },
          { $set: { status: TScheduleBookingStatus.completed } }
        );

        // await SpecialistPatientScheduleBooking.findByIdAndUpdate(workoutClassBookingId, {
        //   $set: {
        //     status: TScheduleBookingStatus.completed,
        //   }
        // });

        console.log(`✅ Schedule ${scheduleId} automatically freed.`);
      }else{
        console.log(`❓ Unknown job type: ${job.name}`);
      }
    },
    {
      connection: redisPubClient.options,
    }
  );
  //@ts-ignore
  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} (${job.name}) completed`);
  });

  worker.on("failed", (job:IScheduleJob, err:any) => {
    console.error(`❌ Job.id ${job?.id} :: ${job.name} {job.} failed`, err);
    errorLogger.error(`❌ Job.id ${job?.id} :: ${job.name} {job.} failed`, err);
  });
  /********
    // Handle Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down worker...");
      await worker.close();
      await scheduleQueue.close();
      process.exit(0);
    });
  ********** */
}

/**************************************************************
 * *********************************************************** */

// Notification Queue
export const notificationQueue = new Queue("notificationQueue", {
  connection: redisPubClient.options,
});
// new QueueScheduler("notificationQueue", { connection: redisPubClient.options });

type NotificationJobName = "sendNotification";


interface IScheduleJobForNotification {
  name: string;
  data : INotification,
  id: string
}

// enqueueWebNotification() this function is called when we need to send notification
// 🔎 search for enqueueWebNotification to see details   

export const startNotificationWorker = () => {
  const worker = new Worker(
    "notificationQueue",
    async (
      job: IScheduleJobForNotification
      // job : Job<INotification, any, NotificationJobName>
    ) => {
      console.log("job.data testing startNotificationWorker::", job.data)
      const { id, name, data } = job;
      logger.info(`Processing notification job ${id} ⚡ ${name}`, data);

      try {
        const notif = await Notification.create({
          title: data.title,
          // subTitle: data.subTitle,
          senderId: data.senderId,
          receiverId: data.receiverId,
          receiverRole: data.receiverRole,
          type: data.type,
          linkFor: data.linkFor,
          linkId: data.linkId,
          referenceFor: data.referenceFor,
          referenceId: data.referenceId,
        });

        // logger.info(`✅ Notification created for ${data.receiverRole} :: `, notif);
        
        let eventName;
        let emitted;

        // 🎨 GUIDE FOR FRONTEND .. if admin then listen for notification::admin event  
        if(data.receiverRole == TRole.admin){
          
          eventName = `notification::admin`;

          emitted = socketService.emitToRole(
            data.receiverRole,
            eventName,
            {
              // id: notif._id.toString(),
              // title: notif.title,
              // senderId: notif.senderId?.toString(),
              // type: notif.type,
              // linkFor: notif.linkFor,
              // linkId: notif.linkId?.toString(),
              // referenceFor: notif.referenceFor,
              // referenceId: notif.referenceId?.toString(),
              // createdAt: notif.createdAt,
              // isRead: notif.isRead || false

              title: data.title,
              // subTitle: data.subTitle,
              senderId: data.senderId,
              receiverId: null,
              receiverRole: data.receiverRole,
              type: data.type,
              linkFor: data.linkFor,
              linkId: data.linkId,
              referenceFor: data.referenceFor,
              referenceId: data.referenceId,
            }            
          );

          if (emitted) {
            logger.info(`🔔 Real-time notification sent to ${data.receiverRole}`);
          } else {
            logger.info(`📴 ${data.receiverRole} is offline, notification saved in DB only`);
          }

        }else{
        
          const receiverId = data.receiverId.toString(); // Ensure it's a string
          eventName = `notification::${receiverId}`;

          // Try to emit to the user
          emitted = await socketService.emitToUser(
            receiverId,
            eventName,
            {
              // id: notif._id.toString(),
              // title: notif.title,
              // senderId: notif.senderId?.toString(),
              // type: notif.type,
              // linkFor: notif.linkFor,
              // linkId: notif.linkId?.toString(),
              // referenceFor: notif.referenceFor,
              // referenceId: notif.referenceId?.toString(),
              // createdAt: notif.createdAt,
              // isRead: notif.isRead || false

              title: data.title,
              // subTitle: data.subTitle,
              senderId: data.senderId,
              receiverId: data.receiverId,
              receiverRole: data.receiverRole,
              type: data.type,
              linkFor: data.linkFor,
              linkId: data.linkId,
              referenceFor: data.referenceFor,
              referenceId: data.referenceId,
            }
          );

          if (emitted) {
            logger.info(`🔔 Real-time notification sent to user ${receiverId}`);
          } else {
            logger.info(`📴 User ${receiverId} is offline, notification saved in DB only`);
          }
        }

      } catch (err: any) {
        console.log("⭕ error block hit  of notification worker", err)
        errorLogger.error(
          `❌ Notification job ${id} failed: ${err.message}`
        );
        throw err; // ensures retry/backoff
      }
    },
    { connection: redisPubClient.options }
  );
  //@ts-ignore
  worker.on("completed", (job) =>
    logger.info(`✅ Notification job ${job.id} (${job.name}) completed`)
  );
  //@ts-ignore
  worker.on("failed", (job, err) =>
    errorLogger.error(`❌ Notification job ${job?.id} (${job?.name}) failed`, err)
  );
};