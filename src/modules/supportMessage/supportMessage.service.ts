import { StatusCodes } from 'http-status-codes';
import { SupportMessage } from './SupportMessage.model';
import { ISupportMessage } from './SupportMessage.interface';
import { GenericService } from '../_generic-module/generic.services';


export class SupportMessageService extends GenericService<
  typeof SupportMessage,
  ISupportMessage
> {
  constructor() {
    super(SupportMessage);
  }
}
