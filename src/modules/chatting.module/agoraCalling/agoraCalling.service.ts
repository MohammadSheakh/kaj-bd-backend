import { StatusCodes } from 'http-status-codes';
import { AgoraCalling } from './agoraCalling.model';
import { IAgoraCalling } from './agoraCalling.interface';
import { GenericService } from '../../_generic-module/generic.services';
// import { RtcRole } from 'agora-token';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { config } from '../../../config';

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

  public async getCallToken(
    userId: string,
    channelName: string,
    role: 'publisher' | 'subscriber' = 'publisher'
  ): Promise<{ token: string; appId: string; channelName: string }> {
    
    try {
      const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const token = this.generateToken(channelName, userId, agoraRole);

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
    const uid = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(uid)) {
      throw new Error(`Invalid userId for Agora token: ${userId}`);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTime + expireTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
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
