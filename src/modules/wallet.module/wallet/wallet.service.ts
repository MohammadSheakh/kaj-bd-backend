//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { Wallet } from './wallet.model';
import { IWallet } from './wallet.interface';
import { GenericService } from '../../_generic-module/generic.services';
import { WalletTransactionHistory } from '../walletTransactionHistory/walletTransactionHistory.model';
import { TWalletTransactionHistory, TWalletTransactionStatus } from '../walletTransactionHistory/walletTransactionHistory.constant';
import { TCurrency } from '../../../enums/payment';


export class WalletService extends GenericService<
  typeof Wallet,
  IWallet
> {
  constructor() {
    super(Wallet);
  }

  //-------------------------------------------------
  // Add Amount to Wallet and Create Wallet Transaction History
  // 🔗➡️ stripeWebhook -> handlePaymentSucceeded() -> updatePurchaseTrainingProgram()
  //-------------------------------------------------
  async addAmountToWalletAndCreateTransactionHistory(userId: string,
    amount: number,
    paymentTransactionId : string,
    description : string, // description helps us to know what is this transaction for
    referenceFor : string,
    referenceId : string,
  ) : Promise<void> {
  
    const wallet : IWallet = await Wallet.findOne({ userId });
    const balanceBeforeTransaction = wallet.amount;
    const balanceAfterTransaction = wallet.amount + amount;

    const updatedWallet : IWallet = await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { amount } },
        { new: true }
    );

    //---------------------------------
    // TODO : MUST .. need to handle this usecase that specialist has no wallet
    //---------------------------------
    if (!updatedWallet) {
        // Handle missing wallet
        throw new Error(`For Specialist Id ${userId} wallet not found so ${amount} can not be added to wallet.`);
    }

    const walletTransactionHistory = await WalletTransactionHistory.create({
      walletId : updatedWallet._id,
      userId : userId,
      paymentTransactionId : paymentTransactionId, 
      withdrawalRequestId : null, // as this is not withdrawal request
      type : TWalletTransactionHistory.credit,
      amount : amount,
      currency : TCurrency.bdt,
      balanceBefore : balanceBeforeTransaction,
      balanceAfter : balanceAfterTransaction,
      description : description,
      status : TWalletTransactionStatus.completed,
      referenceFor,
      referenceId,
    })
  }
}
