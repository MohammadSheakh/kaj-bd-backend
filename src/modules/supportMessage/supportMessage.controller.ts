import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../_generic-module/generic.controller';
import { SupportMessage } from './SupportMessage.model';
import { ISupportMessage } from './SupportMessage.interface';
import { SupportMessageService } from './SupportMessage.service';

export class SupportMessageController extends GenericController<
  typeof SupportMessage,
  ISupportMessage
> {
  SupportMessageService = new SupportMessageService();

  constructor() {
    super(new SupportMessageService(), 'SupportMessage');
  }

  // add more methods here if needed or override the existing ones 
}
