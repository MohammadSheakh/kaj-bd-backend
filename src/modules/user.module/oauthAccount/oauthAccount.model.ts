//@ts-ignore
import { model, Schema } from 'mongoose';
import { IOAuthAccount, IOAuthAccountModel } from './oauthAccount.interface';
import paginate from '../../../common/plugins/paginate';
import { TAuthProvider } from './oauthAccount.constant';


const OAuthAccountSchema = new Schema<IOAuthAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authProvider: {
      type: String,
      enum: [
        TAuthProvider.google,
        TAuthProvider.apple
      ],
      required: true,
    },
    providerId: {  // e.g., Google's 'sub' or Apple's 'sub'
      type: String,
      required: true,
      // Ensure uniqueness per provider to prevent duplicate links
      unique: true, // or use compound index with authProvider
    },
    email: {
      type: String,
      lowercase: true,
      // Optional: you can add validation like email format if needed
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    accessToken: {
      type: String,
      // ⚠️ Store encrypted! Never plain text.
    },
    refreshToken: {
      type: String,
      // ⚠️ Store encrypted!
    },
    tokenExpiry: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

OAuthAccountSchema.plugin(paginate);

OAuthAccountSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
OAuthAccountSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._OAuthAccountId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const OAuthAccount = model<
  IOAuthAccount,
  IOAuthAccountModel
>('OAuthAccount', OAuthAccountSchema);
