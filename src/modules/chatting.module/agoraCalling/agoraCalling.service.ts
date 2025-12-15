import { StatusCodes } from 'http-status-codes';
import { AgoraCalling } from './agoraCalling.model';
import { IAgoraCalling } from './AgoraCalling.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class AgoraCallingService extends GenericService<
  typeof AgoraCalling,
  IAgoraCalling
> {
  constructor() {
    super(AgoraCalling);
  }
}
