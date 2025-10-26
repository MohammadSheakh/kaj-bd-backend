//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { UserProvider } from './userProvider.model';
import { IUserProvider } from './userProvider.interface';
import { GenericService } from '../_generic-module/generic.services';

export class UserProviderService extends GenericService<
  typeof UserProvider,
  IUserProvider
> {
  constructor() {
    super(UserProvider);
  }
}
