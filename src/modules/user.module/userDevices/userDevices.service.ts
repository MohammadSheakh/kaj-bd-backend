import { StatusCodes } from 'http-status-codes';
import { UserDevices } from './userDevices.model';
import { IUserDevices } from './userDevices.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class UserDevicesService extends GenericService<
  typeof UserDevices,
  IUserDevices
> {
  constructor() {
    super(UserDevices);
  }
}
