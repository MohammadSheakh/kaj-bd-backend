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
import { TWithdrawalRequst } from './withdrawalRequst.constant';
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
import { TTransactionFor } from '../../payment.module/paymentTransaction/paymentTransaction.constant';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';

export class WithdrawalRequstController extends GenericController<
  typeof WithdrawalRequst,
  IWithdrawalRequst
> {
  WithdrawalRequstService = new WithdrawalRequstService();

  constructor() {
    super(new WithdrawalRequstService(), 'WithdrawalRequst');
  }

//---------------------------------
// Specialist / Doctor  | Wallet | Create withdrawal request TODO : MUST : NEED_TO_TEST
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

    if(data.requestedAmount > wallet.amount){
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'Insufficient wallet amount',
        success: false,
      });
    }

    const docToCreate : IWithdrawalRequst = {
      walletId : wallet._id, // NEED_TO_TEST : wallet id is coming or not
      userId : data.userId,
      requestedAmount : data.requestedAmount,
      bankAccountNumber : bankInfo.bankAccountNumber,
      bankRoutingNumber : bankInfo.bankRoutingNumber,
      bankAccountHolderName : bankInfo.bankAccountHolderName,
      bankAccountType : bankInfo.bankAccountType,
      bankBranch : bankInfo.bankBranch,
      bankName : bankInfo.bankName,
      status : TWithdrawalRequst.requested,
      requestedAt: new Date(),
      processedAt : null,
    }

    const lastWithdrawalRequest = await WithdrawalRequst.findOne({
      userId: data.userId
    }).sort({
      createdAt: -1
    }) // TODO : MUST : add logic 

    // if last Withdrawal request is in week then we can not create withdrawal request
    /************** TODO : MUST .. uncomment this part
    if (lastWithdrawalRequest && 
      lastWithdrawalRequest.createdAt > new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
    ) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'You can not create withdrawal request in a week',
        success: false,
      });
    }
    ************* */

    //------------------------------------
    // TODO : MUST : Send Notification to Admin that a withdrawal request is created
    //------------------------------------
    
    await enqueueWebNotification(
      `An withdrawal request is created by ${(req.user as IUser).userId} ${(req.user as IUser).userName} for $${data.requestedAmount}`,
      (req.user as IUser).userId as string, // senderId
      null, // receiverId // as we send notification to admin
      TRole.admin, // receiverRole
      TNotificationType.withdrawal, // type
      null, // linkFor
      null // linkId
    );


    const result = await this.service.create(docToCreate);

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

    //📈⚙️ OPTIMIZATION: Process both file types in parallel
    const [proofOfPayment] = await Promise.all([
      processFiles(req.files?.proofOfPayment, TFolderName.wallet)
    ]);

    const withdrawalRequstId = req.params.id;

    const withdrawalRequst : IWithdrawalRequst = await WithdrawalRequst.findById(withdrawalRequstId);

    if (!withdrawalRequst) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'No withdrawalRequst Found',
        success: false,
      });
    }

    // console.log("proofOfPayment 👈", proofOfPayment);
    // console.log("proofOfPayment 👈 type of :: ", typeof proofOfPayment);

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
    // if(withdrawalRequst.walletId){
    //   const wallet = await Wallet.findById(withdrawalRequst.walletId);
    //   if(wallet){
    //     wallet.amount -= withdrawalRequst.requestedAmount;
    //     await wallet.save();
    //   }
    // }else 
      
    if (withdrawalRequst.userId){
      wallet = await Wallet.findOne({
        userId : withdrawalRequst.userId
      });

      console.log("log: wallet.amount => ", typeof wallet.amount,"~~~", wallet.amount);
      console.log("log: withdrawalRequst.requestedAmount => ", typeof withdrawalRequst.requestedAmount , "~~~", withdrawalRequst.requestedAmount);
      console.log("log: wallet.amount - withdrawalRequst.requestedAmount  result => ", wallet.amount - withdrawalRequst.requestedAmount);

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
      currency : TCurrency.usd,
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
      `$${withdrawalRequst.requestedAmount} Withdrawal request is approved by admin`,
      (req?.user as IUser)?.userId as string, // senderId
      withdrawalRequst.userId, // receiverId
      null, // receiverRole
      TNotificationType.payment, // type // 🎨 this is for wallet page routing 
      null, // linkFor // TODO : MUST : need to talk with nirob vai
      null, // linkId
      // TTransactionFor.TrainingProgramPurchase, // referenceFor
      // purchaseTrainingProgram._id // referenceId
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


  // add more methods here if needed or override the existing ones 
}
