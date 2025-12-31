// We dont need this utils file  in this Fertie Backend 
//@ts-ignore
import * as admin from 'firebase-admin';
//@ts-ignore
import { Schema } from 'mongoose';
//@ts-ignore
import dotenv from 'dotenv';
import { config } from '../config';
import { IMessageToEmmit } from '../helpers/socket/socketForChatV3WithFirebase';
// Load environment variables
dotenv.config();


// Initialize Firebase Admin SDK (ensure it's only done once)
let firebaseInitialized = false;

// Helper function to initialize Firebase (call this once at app startup)
// let firebaseInitialized = false;

export const initializeFirebase = (): void => {

  // console.log('Initializing Firebase Admin SDK... 🥌');

  if (firebaseInitialized) {
    // console.log('Firebase is initialized 🥌');
    return;
  }

  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      //  console.log(' 🥌 admin.apps.length', admin.apps.length);

      // Create service account object from environment variables
      const serviceAccount = {
          type: process.env.FIREBASE_TYPE,
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
          universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
      };

      // console.log("serviceAccount :: ", serviceAccount);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('✅ Firebase Admin SDK initialized');
    }
    firebaseInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};
/*------------------------------------------------------
////////////////////////
// 💎✨🔍 V2 Found
////////////////////////
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  receiverId: Schema.Types.ObjectId | string // INFO : naki  userId hobe eita
): Promise<void> => {
  try {
    // Initialize Firebase Admin SDK only once
    initializeFirebase();

    const message = {
      notification: {
        title,
        // body: messageBody.toString(), // Ensure it's a string
      },
      token: fcmToken,
    };

    // Send the notification
    await admin.messaging().send(message);

    console.log('👉🔔👈 Push Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new Error(`Error sending push notification  from firebaseUtils.ts ::  ${error}`);
  }
};

------------------------------------------------------*/

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

export const sendPushNotificationV2 = async (
  fcmToken: string,
  messageData: IMessageToEmmit | string, // Can accept object or stringified JSON
  receiverId: Schema.Types.ObjectId | string
): Promise<void> => {
  try {
    // Initialize Firebase Admin SDK only once
    initializeFirebase();

    const {message, notificationTitle} = await buildFCMMessageV2(messageData as IMessageToEmmit , fcmToken);

    // Send the notification
    const response = await admin.messaging().send(message);

    console.log('👉🔔👈 Push Notification V2 sent successfully:', response);
    
    // console.log('✅ Push notification sent successfully:', {
    //   receiverId,
    //   messageId: response,
    //   title: notificationTitle
    // });

  } catch (error: any) {
    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.error(`❌ Invalid FCM token for receiver ${receiverId}`);
      console.error('Token should be removed from database');
      
      // TODO: Remove invalid token from user document
      // await User.findByIdAndUpdate(receiverId, { $unset: { fcmToken: 1 } });
      
    } else if (error.code === 'messaging/invalid-argument') {
      console.error('❌ Invalid message format:', error.message);
      
    } else {
      console.log("error.code :: ", error.code);
      console.log("error.message :: ", error.message);
      console.error('❌ Error sending push notification:', error);
    }
    
    // Re-throw for upstream handling
    throw new Error(`Error sending push notification: ${error.message || error}`);
  }
};



export const buildFCMMessageV2 = async (
  messageData: IMessageToEmmit | string,
  fcmToken: string,
): Promise<{
  message: admin.messaging.Message;
  notificationTitle: string;
}> => {
  // Parse messageData if it's a string
  // const parsedMessage: IMessageToEmmit =
  //   typeof messageData === 'string' ? JSON.parse(messageData) : messageData;

  // console.log('messageData :: ', messageData);

  const parsedMessage = safeJSONParse(messageData);


  // console.log('Preparing to send push notification with message:', parsedMessage);

  // Prepare notification title and body
  const notificationTitle = parsedMessage.text || 'New Message';
  const notificationBody = parsedMessage.text
    ? parsedMessage.text.length > 100
      ? parsedMessage.text.substring(0, 97) + '...'
      : parsedMessage.text
    : 'You have a new message';

  // Extract safe image URL (handles both string and object)
  let imageUrl =
    typeof parsedMessage.image === 'object'
      ? parsedMessage.image.imageUrl
      : parsedMessage.image;

  // ✅ Check if imageUrl is valid and not already hosted on AWS
  if (imageUrl && typeof imageUrl === 'string') {
    if (!imageUrl.includes('amazonaws.com') && !imageUrl.startsWith('https://')) {
      imageUrl = `${config.backend.shobHoyUrl}/${imageUrl.replace(/^\/+/, '')}`;
    }
  }

  // Helper to ensure all data values are strings
  const toStringValue = (val: any): string =>
    val === undefined || val === null
      ? ''
      : typeof val === 'string'
      ? val
      : val.toString?.() || JSON.stringify(val);

  // Build FCM message
  const message: admin.messaging.Message = {
    notification: {
      title: toStringValue(parsedMessage.name),
      body: notificationBody,// parsedMessage, //notificationBody,
      ...(imageUrl && { imageUrl }),
    },
    data: {
      messageId: toStringValue(parsedMessage._id),
      conversationId: toStringValue(parsedMessage.conversationId),
      senderId: toStringValue(parsedMessage.senderId),
      senderName: toStringValue(parsedMessage.name),
      senderImage: toStringValue(imageUrl),
      messageText: toStringValue(parsedMessage.text),
      createdAt: toStringValue(parsedMessage.createdAt || new Date()),
      type: 'new-message',
      timestamp: Date.now().toString(),
      fullMessage: JSON.stringify(parsedMessage),
    },
    token: fcmToken,
    android: {
      priority: 'high',
      notification: {
        channelId: 'chat_messages',
        sound: 'default',
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: notificationTitle,
            body: notificationBody,
          },
          sound: 'default',
          badge: 1,
          'content-available': 1,
          'mutable-content': 1,
        },
      },
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
    },
  };

  return { message, notificationTitle };
};


function safeJSONParse(data: any) {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('❌ Failed to parse JSON:', data);
    return null;
  }
}

const buildFCMMessage = async ( messageData : IMessageToEmmit, fcmToken:string ) : Promise<{
  message: admin.messaging.Message,
  notificationTitle: string
}> => {
  // Parse messageData if it's a string
    const parsedMessage: IMessageToEmmit = 
      typeof messageData === 'string' 
        ? JSON.parse(messageData) 
        : messageData;

    console.log('Preparing to send push notification V2 with message:', parsedMessage);    

    // Prepare notification title and body
    const notificationTitle = parsedMessage.name || 'New Message';
    const notificationBody = parsedMessage.text 
      ? (parsedMessage.text.length > 100 
          ? parsedMessage.text.substring(0, 97) + '...' 
          : parsedMessage.text)
      : 'You have a new message';

    // Build the FCM message
    const message: admin.messaging.Message = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
        // Add image if available
        ...(parsedMessage.image && { imageUrl: parsedMessage.image })
      },
      data: {
        // Send all message data as strings (FCM requirement)
        messageId: parsedMessage._id?.toString() || '',
        conversationId: parsedMessage.conversationId?.toString() || '',
        senderId: parsedMessage.senderId?.toString() || '',
        senderName: parsedMessage.name || '',
        senderImage: parsedMessage.image || '',
        messageText: parsedMessage.text || '',
        createdAt: parsedMessage.createdAt?.toString() || new Date().toString(),
        type: 'new-message',
        timestamp: Date.now().toString(),
        // Include full message as JSON string for client to parse
        fullMessage: JSON.stringify(parsedMessage)
      },
      token: fcmToken,
      // Android specific configuration
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages',
          sound: 'default',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        }
      },
      // iOS specific configuration
      apns: {
        payload: {
          aps: {
            alert: {
              title: notificationTitle,
              body: notificationBody
            },
            sound: 'default',
            badge: 1, // You might want to track unread count
            'content-available': 1, // For background data sync
            'mutable-content': 1 // For notification service extension
          }
        },
        headers: {
          'apns-priority': '10', // High priority
          'apns-push-type': 'alert'
        }
      }
    };

    return {
      message,
      notificationTitle
    }
}

