//@ts-ignore
import * as admin from 'firebase-admin';
//@ts-ignore
import { Schema } from 'mongoose';
import { Notification } from './notification.model';
// Initialize Firebase Admin SDK (ensure it's only done once)
let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) return;

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    throw new Error('Missing Firebase environment variables');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  firebaseInitialized = true;
};


/*************
 * // calling this function from anywhere .. 
 const registrationToken = req.user?.fcmToken;

    if (registrationToken) {
      await sendPushNotification(
        registrationToken,
        // INFO : amar title, message dorkar nai .. just .. title hoilei hobe ..
        `A new note of DailyLog ${result.title} has been created by  ${req.user.userName} .`,
        project.projectManagerId.toString()
      );
    }
 * ********* */

// This function can now be reused in your services or utils as needed
export const sendPushNotification = async (
  fcmToken: string,
  notificationText: string,
  receiverId: Schema.Types.ObjectId | string // INFO : naki  userId hobe eita
): Promise<void> => {
  try {
    // Initialize Firebase Admin SDK only once
    initializeFirebase();

    const message : admin.messaging.Message = {
      notification: {
        notificationText,
        // body: messageBody.toString(), // Ensure it's a string
      },
      token: fcmToken,
      data: {
        receiverId: receiverId.toString(),
      },
      // Android specific options
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
        },
      },
      // iOS specific options
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send the notification
    const response = await admin.messaging().send(message);

    // 🧠 Avoid spamming FCM (e.g., 100 notifications in 1 sec).

    console.log(`✅ Push notification sent: ${response}`);

  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    throw new Error(`❌ Error sending FCM notification: ${error}`);
  }
};
