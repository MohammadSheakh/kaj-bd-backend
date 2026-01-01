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
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { Wallet } from '../wallet/wallet.model';

export class WalletTransactionHistoryController extends GenericController<
  typeof WalletTransactionHistory,
  IWalletTransactionHistory
> {
  WalletTransactionHistoryService = new WalletTransactionHistoryService();

  constructor() {
    super(new WalletTransactionHistoryService(), 'WalletTransactionHistory');
  }

  getAllWithWallet = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    console.log('filters : ', filters);
    console.log('options : ', options);

    // ✅ Default values
    let populateOptions: (string | { path: string; select: string }[]) = [];
    let select = '-isDeleted -createdAt -updatedAt -__v';

    // ✅ If middleware provided overrides → use them
    if (req.queryOptions) {
      if (req.queryOptions.populate) {
        populateOptions = req.queryOptions.populate;
      }
      if (req.queryOptions.select) {
        select = req.queryOptions.select;
      }
    }

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    // console.log('result: ', result);

    const wallet = await Wallet.findOne({ userId: req.user.userId });

    // console.log('wallet: ', wallet);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: { result, wallet },
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  // Get specialist's own earnings overview - suplify
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
