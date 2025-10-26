//@ts-ignore
import { model, Schema } from 'mongoose';
import { IWalletTransactionHistory, IWalletTransactionHistoryModel } from './walletTransactionHistory.interface';
import paginate from '../../../common/plugins/paginate';
import { TWalletTransactionHistory, TWalletTransactionStatus } from './walletTransactionHistory.constant';
import { TCurrency } from '../../../enums/payment';
import { TTransactionFor } from '../../../constants/TTransactionFor';

const WalletTransactionHistorySchema = new Schema<IWalletTransactionHistory>(
  {
    walletId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    userId: { //🔗 for which user this withdraw request
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentTransactionId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
    },
    withdrawalRequestId : { //🔗
      type: Schema.Types.ObjectId,
      ref: 'WithdrawalRequst',
    },

    type : {
      type: String,
      required: [true, 'type is required'],
      enum: [
        TWalletTransactionHistory.debit,
        TWalletTransactionHistory.credit,
        TWalletTransactionHistory.withdrawal,
      ]
    },

    amount: {
      type: Number,
      required: [true, 'amount is required'],
    },

    currency: {
      type: String,
      enum: [TCurrency.bdt],
      required: [true, 'currency is required'],
    },

    balanceBefore: {
      type: Number,
      required: [true, 'balanceBefore is required'],
    },

    balanceAfter: {
      type: Number,
      required: [true, 'balanceAfter is required'],
    },

    description : {
      type: String,
      required: [false, 'description is not required'],
      trim: true,
      minlength: 2,
      maxlength: 500,
    },

    status : {
      type: String,
      required: [true, 'status is required'],
      enum: [
        TWalletTransactionStatus.pending,
        TWalletTransactionStatus.completed,
        TWalletTransactionStatus.failed,
      ]
    },

    /********
     * 📝 INFO 
     * referenceFor and referenceId are also use in
     * PaymentTransaction model
     * 
     * But For WithdrawalRequst we dont need this 
     * If you update here please update there also
     * 
     * ******** */
    referenceFor: {
      type: String,
      enum: [
        TTransactionFor.UserSubscription, // previously it was SubscriptionPlan
        TTransactionFor.ServiceBooking,  // for paymentTransactionId
        TTransactionFor.WithdrawalRequst,  // for creating WalletTransactionHistory | admin end
      ],
      required: [true, `referenceFor is not required .. it can be  ${Object.values(TTransactionFor).join(
        ', '
      )}`],
    },

    referenceId: { type: Schema.Types.ObjectId, refPath: 'referenceFor',
        required: [true, 'referenceId is not required']
    },

    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

WalletTransactionHistorySchema.plugin(paginate);

WalletTransactionHistorySchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
WalletTransactionHistorySchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._WalletTransactionHistoryId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const WalletTransactionHistory = model<
  IWalletTransactionHistory,
  IWalletTransactionHistoryModel
>('WalletTransactionHistory', WalletTransactionHistorySchema);
