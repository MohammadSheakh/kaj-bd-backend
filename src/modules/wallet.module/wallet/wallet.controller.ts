//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { Wallet } from './wallet.model';
import { IWallet } from './wallet.interface';
import { WalletService } from './wallet.service';

export class WalletController extends GenericController<
  typeof Wallet,
  IWallet
> {
  WalletService = new WalletService();

  constructor() {
    super(new WalletService(), 'Wallet');
  }

  // add more methods here if needed or override the existing ones 
}
