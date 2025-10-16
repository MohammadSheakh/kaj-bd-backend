import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { UserDevices } from './userDevices.model';
import { IUserDevices } from './userDevices.interface';
import { UserDevicesService } from './userDevices.service';

export class UserDevicesController extends GenericController<
  typeof UserDevices,
  IUserDevices
> {
  UserDevicesService = new UserDevicesService();

  constructor() {
    super(new UserDevicesService(), 'UserDevices');
  }

  // add more methods here if needed or override the existing ones 
}
