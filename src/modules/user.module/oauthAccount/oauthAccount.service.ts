//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { OAuthAccount } from './oauthAccount.model';
import { IOAuthAccount } from './oauthAccount.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class OAuthAccountService extends GenericService<
  typeof OAuthAccount,
  IOAuthAccount
> {
  constructor() {
    super(OAuthAccount);
  }
}
