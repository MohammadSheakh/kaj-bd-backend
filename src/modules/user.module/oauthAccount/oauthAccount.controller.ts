//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { OAuthAccount } from './oauthAccount.model';
import { IOAuthAccount } from './oauthAccount.interface';
import { OAuthAccountService } from './oauthAccount.service';

export class OAuthAccountController extends GenericController<
  typeof OAuthAccount,
  IOAuthAccount
> {
  OAuthAccountService = new OAuthAccountService();

  constructor() {
    super(new OAuthAccountService(), 'OAuthAccount');
  }

  // add more methods here if needed or override the existing ones 
}
