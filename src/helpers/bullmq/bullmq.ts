//@ts-ignore
import { Queue, Worker, QueueScheduler, Job } from "bullmq";
import { errorLogger, logger } from "../../shared/logger";
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
        
        console.log(`✅ Schedule ${scheduleId} automatically expired at ${new Date().toLocaleString()}.`);
      }else if (job.name === "makeSpecialistWorkoutClassScheduleAvailable") {
        console.log("🔎🔎🔎🔎 makeSpecialistWorkoutClassScheduleAvailable ")
        const { scheduleId } = job.data; 
        /***
         * we dont need booking id here as multiple patient can book a workout class
         * we will update all the booking status to completed where workoutClassScheduleId = scheduleId
         *
         ** */

        /*****
          if (schedule.status === TSpecialistWorkoutClassSchedule.available) {
            console.log(`⏩ Schedule ${scheduleId} is already available. Skipping job.`);
            return;
          }

          /*----------------
          * we need batch update here .. as multiple patient can book a workout class
          *-----------------
          
          await SpecialistPatientScheduleBooking.updateMany(
            { workoutClassScheduleId: scheduleId },
            { $set: { status: TScheduleBookingStatus.completed } }
          );

        ****** */

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
          idOfType: data.idOfType,
          linkFor: data.linkFor,
          linkId: data.linkId,
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
              title: data.title,
              // subTitle: data.subTitle,
              senderId: data.senderId,
              receiverId: null,
              receiverRole: data.receiverRole,
              type: data.type,
              idOfType: data.idOfType,
              linkFor: data.linkFor,
              linkId: data.linkId,
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
              title: data.title,
              // subTitle: data.subTitle,
              senderId: data.senderId,
              receiverId: data.receiverId,
              receiverRole: data.receiverRole,
              type: data.type,
              idOfType: data.idOfType,
              linkFor: data.linkFor,
              linkId: data.linkId,
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