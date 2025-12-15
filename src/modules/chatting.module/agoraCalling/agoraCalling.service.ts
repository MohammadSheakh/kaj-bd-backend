import { StatusCodes } from 'http-status-codes';
import { AgoraCalling } from './agoraCalling.model';
import { IAgoraCalling } from './agoraCalling.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class AgoraCallingService extends GenericService<
  typeof AgoraCalling,
  IAgoraCalling
> {
  constructor() {
    super(AgoraCalling);
  }

  public async getCallToken(
    userId: string,
    channelName: string,
    role: 'publisher' | 'subscriber' = 'publisher'
  ): Promise<{ token: string; appId: string; channelName: string }> {
    
    try {
      const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const token = this.agoraService.generateToken(channelName, userId, agoraRole);

      return {
        token,
        appId: this.agoraService.appId,
        channelName,
      };
    } catch (error) {
      logger.error(`Failed to generate Agora token for user ${userId} in channel ${channelName}:`, error);
      throw new Error('Failed to generate call token');
    }
  }
}
