import { StatusCodes } from 'http-status-codes';
import { UserDevices } from './UserDevices.model';
import { IUserDevices } from './UserDevices.interface';
import { GenericService } from '../_generic-module/generic.services';


export class UserDevicesService extends GenericService<
  typeof UserDevices,
  IUserDevices
> {
  constructor() {
    super(UserDevices);
  }
}
