import { StatusCodes } from 'http-status-codes';
import { AgoraCalling } from './agoraCalling.model';
import { IAgoraCalling } from './agoraCalling.interface';
import { GenericService } from '../../_generic-module/generic.services';
// import { RtcRole } from 'agora-token';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { config } from '../../../config';
import { IMessageToEmmit, socketService } from '../../../helpers/socket/socketForChatV3WithFirebase';
import { Conversation } from '../conversation/conversation.model';
import { ConversationParticipents } from '../conversationParticipents/conversationParticipents.model';
import { IMessage } from '../message/message.interface';
import { Message } from '../message/message.model';
import { UserDevices } from '../../user.module/userDevices/userDevices.model';
import { IUserDevices } from '../../user.module/userDevices/userDevices.interface';
import { sendPushNotificationV2 } from '../../../utils/firebaseUtils';
import { User } from '../../user.module/user/user.model';
import { IUser } from '../../user.module/user/user.interface';
import { IConversationParticipents } from '../conversationParticipents/conversationParticipents.interface';
import ApiError from '../../../errors/ApiError';

export class AgoraCallingService extends GenericService<
  typeof AgoraCalling,
  IAgoraCalling
> {
  private appId: string;
  private appCertificate: string;

  constructor() {
    super(AgoraCalling);
    
    this.appId = config.agora.appId!;
    this.appCertificate = config.agora.appCertificationPrimary!;
  }

  //--------------------------------  💎✨🔍 -> V2 Found
  public async getCallToken(
    userId: string,
    channelName: string, // channelName is conversationId
    role: 'publisher' | 'subscriber' = 'publisher'
  ): Promise<{ token: string; appId: string; channelName: string }> {
    
    try {
      const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const token = this.generateToken(channelName, userId, agoraRole);

      // lets emit and event to UserB that userA calls him

      const userProfile : IUser | null = await User.findById(userId);

      if(!userProfile){
        throw new Error(`User with ID ${userId} not found`);
      }

      // Get chat details
      const {conversationData, conversationParticipants} = await getConversationById(channelName);
    
      /*-------------------------------
    
      ----------------------------------*/

      //---------------------------------
      // As per sayed vais suggestion, we will emit the event to the specific conversation room
      // as when a user send attachments via chat, we need to notify all the participants of that conversation
      //---------------------------------

      const eventName = `incoming-call`;
    
    
      // ============================================
      // 3️⃣ HANDLE EACH PARTICIPANT
      // ============================================
      for (const participant of conversationParticipants) {
        const participantId = participant.userId?.toString();
        
        // Skip the sender
        if (participantId === userId.toString()) {
          continue;
        }

        // Prepare message data for emission
        const messageToEmit:IMessageToEmmit = {
          senderId: userId, // senderId should be the userId
          name: userProfile?.name,
          image: userProfile?.profileImage
        };

        const isOnline = await socketService.isUserOnline(participantId.toString()); // current way need to test

        /*----------------------  ************** for calling usecase.. room is not matter ..  we just need to send push notification

        ---------------------------------------*/

        if (isOnline) { // && !isInConversationRoom
          // ⚠️ User is online but NOT in this conversation room
          // Send both socket notification AND conversation list update
          // console.log(`⚠️ User ${participantId} is online but not in room, sending notification 3️⃣`);
          
          // Send message notification to personal room
          socketService.emitToUser(
            participantId,
            eventName,
            {
              message : `${userProfile?.name} is calling you`,
              image: userProfile?.profileImage,
            }
          )

          /*----------------------------------------
          
          ----------------------------------------*/

        } else {
          // 🔴 User is OFFLINE - send push notification
          console.log(`🔴 User ${participantId} is offline, sending push notification 4️⃣`);
          
          try {
            // Fetch user's FCM token
            //const user = await User.findById(participantId).select('fcmToken');
            // --- previous line logic was for one device .. now we design a system where user can have multiple device

            const userDevices:IUserDevices[] = await UserDevices.find({
              userId: participantId, 
            });
            if(!userDevices){
              console.log(`⚠️ No FCM token found for user ${participantId}`);
              // TODO : MUST : need to think how to handle this case
            }

            // fcmToken,deviceType,deviceName,lastActive,
            for(const userDevice of userDevices){
              await sendPushNotificationV2(
                userDevice.fcmToken,
                {
                  message : `${userProfile?.name} is calling you`,
                  image: userProfile?.profileImage,
                },
                participantId
              );
            }

          } catch (error) {
            console.error(`❌ Failed to send push notification to ${participantId}: 7️⃣`, error);
          }
        }
      }

      return {
        token,
        appId: this.appId,
        channelName,
      };
    } catch (error) {
      // logger.error();
      // throw new Error('Failed to generate call token');
      throw new Error(`Failed to generate Agora token for user ${userId} in channel ${channelName}: ${error}`);
    }
  }

  // ============================================
  // UID CONVERSION HELPER
  // ============================================
  /**
   * Converts MongoDB ObjectId to Agora UID (32-bit unsigned integer)
   * Agora UIDs must be: 1 to (2^32 - 1)
   */
  private convertToAgoraUid(mongoId: string): number {
    // Method 1: Hash the last 8 characters and convert to number
    const last8Chars = mongoId.slice(-8);
    const uid = parseInt(last8Chars, 16) % 0xFFFFFFFF;
    
    // Ensure UID is never 0
    return uid === 0 ? 1 : uid;
    
    // Alternative Method 2: Use a hash function for better distribution
    // You could also use a library like 'object-hash' or store a mapping in DB
  }

  public async getCallTokenV2(
    userId: string,
    channelName: string, // channelName is conversationId
    role: 'publisher' | 'subscriber' = 'publisher'
  ): Promise<{ token: string; appId: string; channelName: string }> {
    
    try {
      const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

      // 4️⃣ Generate Agora UID from MongoDB ObjectId
      // const agoraUid = this.convertToAgoraUid(userId);

      const token = this.generateToken(channelName, userId, agoraRole);
      //const token = this.generateToken(channelName, agoraUid, agoraRole);

      const userProfile : IUser | null = await User.findById(userId);

      if(!userProfile){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'User with ID ${userId} not found');
      }

      // Get chat details
      const {conversationData, conversationParticipants} = await getConversationById(channelName);
    
      // ============================================
      // 3️⃣ Check this user in conversation participants or not
      // ============================================

      const isUserInConversation = conversationParticipants.some(
        participant => participant.userId.toString() === userId.toString()
      );

      if(isUserInConversation == false){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not a participants of this conversation');
      }

  
      return {
        token,
        appId: this.appId,
        channelName,
      };
    } catch (error) {
      
      throw new ApiError(StatusCodes.BAD_REQUEST, `Failed to generate Agora token for user ${userId} in channel ${channelName}: ${error}`);
    }
  }

  

  /**
   * Generate an RTC token for a user to join a specific channel.
   * @param channelName - The unique ID for the call (e.g., conversationId or callSessionId)
   * @param userId - The user's ID (must be a number or string convertible to number)
   * @param role - Role of the user (host or audience)
   * @param expireTimeInSeconds - Token expiration time (default: 3600s = 1 hour)
   * @returns {string} - The generated Agora token
   */
  generateToken(
    channelName: string,
    userId: string | number,
    role: RtcRole = RtcRole.PUBLISHER, // Default to publisher (can send/receive audio/video)
    expireTimeInSeconds: number = 3600
  ): string {
    
    const uid = typeof userId === 'string' ? parseInt(userId, 10) : userId; // ISSUE : Multiple users may end up with the same UID
    if (isNaN(uid)) {
      throw new Error(`Invalid userId for Agora token: ${userId}`);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTime + expireTimeInSeconds;

    // console.log("primary token :: ", this.appCertificate);

    return RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      // uid,
      // userId.toString(),
      0,
      role,
      privilegeExpiredTs
    );
  }

  /**
   * Generate a token for a user to join as an audience (receive only).
   * Useful for viewers in group calls.
   */
  generateAudienceToken(channelName: string, userId: string | number): string {
    return this.generateToken(channelName, userId, RtcRole.SUBSCRIBER, 3600);
  }
}

// Need to move to message or conversations service file .. 
async function getConversationById(conversationId: string) {
  try {
    const conversationData = await Conversation.findById(conversationId)//.populate('users').exec();  // FIXME: user populate korar bishoy ta 
    // FIXME : check korte hobe  
    
    const conversationParticipants = await ConversationParticipents.find({
      conversationId: conversationId
    });

    if (!conversationData) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }
    return { 
      conversationData: conversationData,
      conversationParticipants: conversationParticipants
    };
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
}
