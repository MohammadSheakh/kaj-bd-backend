//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { UserRoleData } from './userRoleData.model';
import { IUserRoleData } from './userRoleData.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class UserRoleDataService extends GenericService<
  typeof UserRoleData,
  IUserRoleData
> {
  constructor() {
    super(UserRoleData);
  }
}
