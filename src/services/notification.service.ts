import { notificationQueue } from "../helpers/bullmq/bullmq";
import { TNotificationType } from "../modules/notification/notification.constants";
import { TTransactionFor } from "../modules/payment.module/paymentTransaction/paymentTransaction.constant";

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
  /****
   * this linkFor is for navigation in front-end 
   * so that in query we can pass linkFor=linkId
   * **** */
  linkFor?: string | null,
  //---------------------------------
  // value for linkFor query
  //---------------------------------
  linkId?: string | null,
  referenceFor?: TTransactionFor,
  referenceId?: string
) {

  const notifAdded = await notificationQueue.add(
    'send-notification',
    {
      title,
      senderId,
      receiverId,
      receiverRole,
      type,
      linkFor,
      linkId,
      referenceFor, // what if referenceFor is null
      referenceId // what if referenceId is null
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

  console.log("🔔 enqueueWebNotification hit :: notifAdded -> ")//notifAdded
}