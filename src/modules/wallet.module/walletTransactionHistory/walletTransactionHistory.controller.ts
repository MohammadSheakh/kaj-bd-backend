//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../_generic-module/generic.controller';
import { WalletTransactionHistory } from './walletTransactionHistory.model';
import { IWalletTransactionHistory } from './walletTransactionHistory.interface';
import { WalletTransactionHistoryService } from './walletTransactionHistory.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

export class WalletTransactionHistoryController extends GenericController<
  typeof WalletTransactionHistory,
  IWalletTransactionHistory
> {
  WalletTransactionHistoryService = new WalletTransactionHistoryService();

  constructor() {
    super(new WalletTransactionHistoryService(), 'WalletTransactionHistory');
  }

  // Get specialist's own earnings overview
  getMyEarningsOverview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await this.WalletTransactionHistoryService.getSpecialistEarningsOverview(userId);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'My earnings overview retrieved successfully',
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
