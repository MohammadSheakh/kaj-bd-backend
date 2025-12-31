import { notificationQueue } from "../helpers/bullmq/bullmq";
import { TNotificationType } from "../modules/notification/notification.constants";
//@ts-ignore
import { Types } from "mongoose";

//---------------------------------
//  global method to send notification through bull queue
//---------------------------------
export async function enqueueWebNotification(
  // existingTrainingProgram, user: any
  title: string,
  senderId: string,
  receiverId: string,
  /***
   * receiverRole can be null .. important for admin
   * ** */
  receiverRole: string | null, // for admin .. we must need role .. otherwise we dont need role 
  
  type: TNotificationType,
  
  idOfType: Types.ObjectId, //🧩
  
  //---------------------------------
  // queryParamValue  so that in query we can pass queryParamKey=queryParamValue
  //---------------------------------
  linkFor?: string | null,

  //---------------------------------
  // queryParamValue 
  //---------------------------------
  linkId?: string | null,
) {

  const notifAdded = await notificationQueue.add(
    'send-notification-kajbd',
    {
      title,
      senderId,
      receiverId,
      receiverRole,
      type,
      idOfType,
      linkFor,
      linkId,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s
      },
      removeOnComplete: true,
      removeOnFail: 1000, // keep failed jobs for debugging
    }
  );

  // console.log("🔔 enqueueWebNotification hit :: notifAdded -> ")//notifAdded
}