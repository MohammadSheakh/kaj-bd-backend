import { StatusCodes } from 'http-status-codes';
import { UserRoleData } from './UserRoleData.model';
import { IUserRoleData } from './UserRoleData.interface';
import { GenericService } from '../_generic-module/generic.services';


export class UserRoleDataService extends GenericService<
  typeof UserRoleData,
  IUserRoleData
> {
  constructor() {
    super(UserRoleData);
  }
}
