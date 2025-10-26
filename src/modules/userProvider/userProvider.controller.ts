//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../_generic-module/generic.controller';
import { UserProvider } from './userProvider.model';
import { IUserProvider } from './UserProvider.interface';
import { UserProviderService } from './userProvider.service';

export class UserProviderController extends GenericController<
  typeof UserProvider,
  IUserProvider
> {
  UserProviderService = new UserProviderService();

  constructor() {
    super(new UserProviderService(), 'UserProvider');
  }

  // add more methods here if needed or override the existing ones 
}
