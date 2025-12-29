//@ts-ignore
import { model, Schema } from 'mongoose';
import { IWithdrawalRequst, IWithdrawalRequstModel } from './withdrawalRequst.interface';
import paginate from '../../../common/plugins/paginate';
import { TWithdrawalRequst } from './withdrawalRequst.constant';
import { TAccountType, TBankAccount, TWithdrawalRequstType } from '../bankInfo/bankInfo.constant';


const WithdrawalRequstSchema = new Schema<IWithdrawalRequst>(
  {
    walletId: { //🔗 for which wallet this withdraw request
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    userId: { //🔗 for which user this withdraw request
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    requestedAmount: {
      type: Number,
      required: [true, 'requestedAmount is required'],
    },

    bankAccountNumber: {
      type: String,
      required: [false, 'bankAccountNumber is not required'],
    },

    bankRoutingNumber: {
      type: String,
      required: [false, 'bankRoutingNumber is not required'],
    },

    bankAccountHolderName: {
      type: String,
      required: [false, 'bankAccountHolderName is not required'],
    },

    bankAccountType: {
      type: String,
      enum : [
        TBankAccount.savings,
        TBankAccount.current  
      ],
      required: [false, 'bankAccountType is not required'],
    },

    bankBranch: {
      type: String,
      required: [false, 'bankBranch is not required'],
    },

    bankName: {
      type: String,
      required: [false, 'bankName is not required'],
    },

    type: {
      type: String,
      enum : [
        TWithdrawalRequstType.bank,
        TWithdrawalRequstType.bkash,
        TWithdrawalRequstType.nagad,
        TWithdrawalRequstType.rocket 
      ],
      required: [true, 'type is required'],
    },

    mobileNo: {
      type: String,
      required: [false, 'mobileNo is not required'],
    },

    accountType : {
      type: String,
      enum : [
        TAccountType.personal,
        TAccountType.merchant,
      ],
      required: [false, 'accountType is not required'],
    },

    status:{
      type: String,
      enum:[
        TWithdrawalRequst.completed,
        TWithdrawalRequst.failed,
        TWithdrawalRequst.processing,
        TWithdrawalRequst.requested,
        TWithdrawalRequst.rejected,
      ],
    },
    proofOfPayment:[//🔗🖼️
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'attachments is not required'],
      }
    ],
    
    // {
    //   type: String,
    //   required: [false, 'proofOfPayment is not required'],
    //   default: null,
    // },
    requestedAt: {
      type: Date,
      required: [true, 'requestedAt is required'],
      default: Date.now,
    },
    
    processedAt: {
      type: Date,
      required: [false, 'processedAt is not required'],
      default: null,
    },

    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

WithdrawalRequstSchema.plugin(paginate);

WithdrawalRequstSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
WithdrawalRequstSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._WithdrawalRequstId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const WithdrawalRequst = model<
  IWithdrawalRequst,
  IWithdrawalRequstModel
>('WithdrawalRequst', WithdrawalRequstSchema);
