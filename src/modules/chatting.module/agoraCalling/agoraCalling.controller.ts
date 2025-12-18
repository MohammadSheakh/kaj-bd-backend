import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { AgoraCalling } from './agoraCalling.model';
import { IAgoraCalling } from './agoraCalling.interface';
import { AgoraCallingService } from './agoraCalling.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { socketService } from '../../../helpers/socket/socketForChatV3WithFirebase';

export class AgoraCallingController extends GenericController<
  typeof AgoraCalling,
  IAgoraCalling
> {
  AgoraCallingService = new AgoraCallingService();
  
  constructor() {
    super(new AgoraCallingService(), 'AgoraCalling');
  }

  generateToken = catchAsync(async (req: Request, res: Response) :Promise<any> => {
    const { userId, channelName, role = 'publisher' } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required' });
    }

    // const tokenData = await socketService.getCallToken(userId, channelName, role);
    const tokenData = await this.AgoraCallingService.getCallTokenV2(req.user.userId, channelName, role);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: tokenData,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  

  // add more methods here if needed or override the existing ones 
}
