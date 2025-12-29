//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { WithdrawalRequst } from './withdrawalRequst.model';
import { IWithdrawalRequst } from './withdrawalRequst.interface';
import { WithdrawalRequstService } from './withdrawalRequst.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
// import { IUser } from '../../token/token.interface';
import { BankInfo } from '../bankInfo/bankInfo.model';
import { Wallet } from '../wallet/wallet.model';
import { IWallet } from '../wallet/wallet.interface';
import { TRequstStatus, TWithdrawalRequst } from './withdrawalRequst.constant';
import { processFiles } from '../../../helpers/processFilesToUpload';
import { TFolderName } from '../../../enums/folderNames';
import { User } from '../../user.module/user/user.model';
import { IUser as IUserMain } from '../../user.module/user/user.interface';
import { IUser } from '../../token/token.interface';
import { enqueueWebNotification } from '../../../services/notification.service';
import { TRole } from '../../../middlewares/roles';
import { TNotificationType } from '../../notification/notification.constants';
import { WalletTransactionHistory } from '../walletTransactionHistory/walletTransactionHistory.model';
import { TWalletTransactionHistory, TWalletTransactionStatus } from '../walletTransactionHistory/walletTransactionHistory.constant';
import { TCurrency } from '../../../enums/payment';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { TTransactionFor } from '../../../constants/TTransactionFor';
import ApiError from '../../../errors/ApiError';
import { TWithdrawalRequstType } from '../bankInfo/bankInfo.constant';

export class WithdrawalRequstController extends GenericController<
  typeof WithdrawalRequst,
  IWithdrawalRequst
> {
  WithdrawalRequstService = new WithdrawalRequstService();

  constructor() {
    super(new WithdrawalRequstService(), 'WithdrawalRequst');
  }

//---------------------------------
// Provider | Wallet | Create withdrawal request TODO : MUST : NEED_TO_TEST
//---------------------------------
  create = catchAsync(async (req: Request, res: Response) => {
    
    const data:IWithdrawalRequst = req.body;

    data.userId = (req.user as IUser).userId;

    const user:IUserMain = await User.findById((req.user as IUser).userId).select('walletId').lean(); 

    /********
     * 📝
     * first we check withdrawl amount is less than wallet amount
     * TODO : MUST : mongodb transaction add korte hobe 
     *  
     * check user have current bank information or not 
     * 
     * for requested user.. we need to check last withdrawal request is in week or not
     * if in week then we can not create withdrawal request
     * 
     * ****** */

    // lets get the wallet
    const wallet:IWallet = await Wallet.findOne({
      userId: data.userId,
      _id: user.walletId
    });

    if (!wallet) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'No wallet Found',
        success: false,
      });
    }

    /*-----------------------------------------
    const bankInfo = await BankInfo.findOne({
      userId: data.userId,
      isActive : true
    })

    if (!bankInfo) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'No Bank Info Found . Please add bank info first .',
        success: false,
      });
    }
    -----------------------------------------*/

    if(data.requestedAmount > wallet.amount){
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'Insufficient wallet amount',
        success: false,
      });
    }

    /*
    const docToCreate : IWithdrawalRequst = {
      walletId : wallet._id, // NEED_TO_TEST : wallet id is coming or not
      userId : data.userId,
      requestedAmount : data.requestedAmount,
      bankAccountNumber : data.bankAccountNumber,
      bankRoutingNumber : data.bankRoutingNumber,
      bankAccountHolderName : data.bankAccountHolderName,
      bankAccountType : data.bankAccountType,
      bankBranch : data.bankBranch,
      bankName : data.bankName,
      status : TWithdrawalRequst.requested,
      requestedAt: new Date(),
      processedAt : null,
    }
    */

    const docToCreate: any = {
      walletId: wallet._id,
      userId: data.userId,
      requestedAmount: data.requestedAmount,

      type: data.type,

      ...(data.type === TWithdrawalRequstType.bank && {
        bankAccountNumber: data.bankAccountNumber,
        bankRoutingNumber: data.bankRoutingNumber,
        bankAccountHolderName: data.bankAccountHolderName,
        bankAccountType: data.bankAccountType,
        bankBranch: data.bankBranch,
        bankName: data.bankName,
      }),

      ...(
        [TWithdrawalRequstType.bkash, TWithdrawalRequstType.nagad, TWithdrawalRequstType.rocket]
          .includes(data.type) && {
          mobileNo: data.mobileNo,
          accountType: data.accountType,
        }
      ),

      status: TWithdrawalRequst.requested,
      requestedAt: new Date(),
      processedAt: null,
    };


    const result = await this.service.create(docToCreate);

    //------------------------------------
    // Send Notification to Admin that a withdrawal request is created
    //------------------------------------
    
    await enqueueWebNotification(
      `An withdrawal request is created by ${(req.user as IUser).userId} ${(req.user as IUser).userName} for $${data.requestedAmount}`,
      (req.user as IUser).userId as string, // senderId
      null, // receiverId // as we send notification to admin
      TRole.admin, // receiverRole
      TNotificationType.withdrawal, // type
      result._id, // idOfType
      null, // linkFor queryParamKey
      null // linkId queryParamValue
    );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  //---------------------------------
  //  Admin | Upload receipt And Update status 
  //---------------------------------
  uploadReceiptAndUpdateStatus = catchAsync(async (req: Request, res: Response) => {
    /*******
     * 📝
     * deduct the amount of wallet and update status to completed
     * without "proofOfPayment" document dont let user to update status 
     * update the "processedAt" date
     * ------TODO : MUST : if already complete we dont want to update again 
     * ------TODO : MUST : add mongo db transaction here
     * ***** */

    

    const withdrawalRequstId = req.params.id;

    const withdrawalRequst : IWithdrawalRequst = await WithdrawalRequst.findById(withdrawalRequstId);

    if (!withdrawalRequst) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'No withdrawalRequst Found',
        success: false,
      });
    }

    if(withdrawalRequst.status.toString() == TWithdrawalRequst.rejected.toString()){
      console.log("withdrawalRequst.status.toString() :: ",withdrawalRequst.status.toString())
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'Withdrawal Request is already rejected',
        success: false,
      });
    }

    if(withdrawalRequst.status.toString() == TWithdrawalRequst.completed.toString()){
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'Withdrawal Request is already accepted',
        success: false,
      });
    }

    if(req.body.status.toString() === TRequstStatus.reject.toString()){

      //------------------------------------
      // Send Notification to Provider that a withdrawal request is rejected
      //------------------------------------
      await enqueueWebNotification(
        `৳${withdrawalRequst.requestedAmount} Withdrawal request is rejected by admin`,
        (req?.user as IUser)?.userId as string, // senderId
        withdrawalRequst.userId, // receiverId
        null, // receiverRole
        TNotificationType.rejectWithdrawal, // type // 🎨 this is for wallet page routing
        null, // id of type 
        null, // linkFor 
        null, // linkId
      );

      withdrawalRequst.status = TWithdrawalRequst.rejected;
      withdrawalRequst.processedAt = new Date();

      // TODO : FEAT : admin can also add a simple note .. which shows why he reject this request .. for better user experience

      const updated =  await withdrawalRequst.save();

      return sendResponse(res, {
        code: StatusCodes.OK,
        data: updated,
        message: `${this.modelName} is rejected`,
        success: true,
      });
    }

    //📈⚙️ OPTIMIZATION: Process both file types in parallel
    const [proofOfPayment] = await Promise.all([
      processFiles(req.files?.proofOfPayment, TFolderName.wallet)
    ]);

    withdrawalRequst.proofOfPayment = proofOfPayment[0];
    withdrawalRequst.status = TWithdrawalRequst.completed;
    withdrawalRequst.processedAt = new Date();

    const updated =  await withdrawalRequst.save();

    let balanceBeforeTransaction : number ;
    let balanceAfterTransaction : number ; 
    let wallet;
    
    //------------------------------------
    // Deduct amount from  Doctor / Patient's wallet
    //------------------------------------
      
    if (withdrawalRequst.userId){
      wallet = await Wallet.findOne({
        userId : withdrawalRequst.userId
      });

      // console.log("log: wallet.amount => ", typeof wallet.amount,"~~~", wallet.amount);
      // console.log("log: withdrawalRequst.requestedAmount => ", typeof withdrawalRequst.requestedAmount , "~~~", withdrawalRequst.requestedAmount);
      // console.log("log: wallet.amount - withdrawalRequst.requestedAmount  result => ", wallet.amount - withdrawalRequst.requestedAmount);

      if(wallet){

        balanceBeforeTransaction = wallet.amount;

        wallet.amount -= withdrawalRequst.requestedAmount;

        balanceAfterTransaction = wallet.amount;

        await wallet.save();
      }
    }

    //------------------------------------
    // Create Wallet transaction History for Doctor / Patient's wallet
    //------------------------------------

    const walletTransactionHistory = await WalletTransactionHistory.create({
      walletId : wallet._id,
      userId : withdrawalRequst.userId,
      paymentTransactionId : null, // as this is withdrawal request
      withdrawalRequestId : withdrawalRequst._id,
      type : TWalletTransactionHistory.withdrawal,
      amount : withdrawalRequst.requestedAmount,
      currency : TCurrency.bdt,
      balanceBefore : balanceBeforeTransaction,
      balanceAfter : balanceAfterTransaction,
      description : 'withdrawal requst approved by admin',
      status : TWalletTransactionStatus.completed,
      referenceFor : TTransactionFor.WithdrawalRequst,
      referenceId : withdrawalRequst._id
    })

    //------------------------------------
    // Send Notification to Doctor / Patient that a withdrawal request is approved
    //------------------------------------
    await enqueueWebNotification(
      `৳${withdrawalRequst.requestedAmount} Withdrawal request is approved by admin`,
      (req?.user as IUser)?.userId as string, // senderId
      withdrawalRequst.userId, // receiverId
      null, // receiverRole
      TNotificationType.payment, // type // 🎨 this is for wallet page routing
      walletTransactionHistory._id, // id of type 
      null, // linkFor 
      null, // linkId
    );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: updated,
      message: `${this.modelName} updated successfully`,
      success: true,
    });
  })

  //---------------------------------
  //  Doctor / Specialist | Get all withdrawal Requst With Wallet Amount  
  //---------------------------------
  getAllWithPaginationV2WithWalletAmount = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

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

    // ⚠️ NEED_OPTIMIZATION : TODO : with parallal processing
    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    const walletAmount = await Wallet.findOne({
      userId: req.user?.userId
    }).select('amount').lean();

    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        result,
        walletAmount
      },
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  /*------------------------------------------------------
  //---------------------------------
  //  Admin | Get all withdrawal Requst Within From To created date  
  //---------------------------------
  getAllWithPaginationV2 = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

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
    console.log(filters);
    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });
  -------------------------------------------------------*/

  /*----------------------------------- for getAllWithPaginationV2 ...  we add this thing to middleware
    
    if (req.query.from && req.query.to) {
      const from = `${req.query.from}T00:00:00.000Z`;
      const to   = `${req.query.to}T23:59:59.999Z`;

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
      }

      filters.createdAt = {
        $gte: fromDate,
        $lte: toDate
      };
    }

    delete filters.from;
    delete filters.to;

    ---------------------------------------*/


  // add more methods here if needed or override the existing ones 
}
