import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { UserRoleData } from './userRoleData.model';
import { IUserRoleData } from './userRoleData.interface';
import { UserRoleDataService } from './userRoleData.service';

export class UserRoleDataController extends GenericController<
  typeof UserRoleData,
  IUserRoleData
> {
  UserRoleDataService = new UserRoleDataService();

  constructor() {
    super(new UserRoleDataService(), 'UserRoleData');
  }

  // add more methods here if needed or override the existing ones 
}
