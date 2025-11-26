import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../_generic-module/generic.controller';
import { SupportMessage } from './supportMessage.model';
import { ISupportMessage } from './supportMessage.interface';
import { SupportMessageService } from './supportMessage.service';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';

export class SupportMessageController extends GenericController<
  typeof SupportMessage,
  ISupportMessage
> {
  supportMessageService = new SupportMessageService();

  constructor() {
    super(new SupportMessageService(), 'SupportMessage');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:any = req.body;
    data.creatorId = req.user.userId;

    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  changeResolveSatus = catchAsync(async (req: Request, res: Response) => {
    
    let supportMessageId = req.params.id;
    const result = await this.supportMessageService.changeResolveSatus(supportMessageId);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} status updated successfully`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
