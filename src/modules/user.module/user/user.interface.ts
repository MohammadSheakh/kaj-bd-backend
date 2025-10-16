//@ts-ignore
import { Document, Model, Types } from 'mongoose';
import { Role } from '../../../middlewares/roles';
import { TStatusType } from './user.constant';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TSubscription } from '../../../enums/subscription';

export type TProfileImage = {
  imageUrl: string;
  // file: Record<string, any>;
};

export interface IUser extends Document {
  _userId: undefined | Types.ObjectId;
  _id:  undefined; // Types.ObjectId |
  profileId : Types.ObjectId | undefined; 
  // fullName: string;
  name: string;
  email: string;
  password: string;
  status: TStatusType.active | TStatusType.inactive;
  subscriptionType : TSubscription;
  // TSubscription.standard |
  // TSubscription.standardPlus | TSubscription.vise 
  hasUsedFreeTrial: boolean;
  // freeTrialStartDate: Date;
  // freeTrialEndDate: Date;
  profileImage?: TProfileImage;
  fcmToken : string;
  stripe_customer_id: string;
  stripeConnectedAccount: string; // from kappes backend 
  role: Role;

  isEmailVerified: boolean;
  isVip  : Boolean,
  isStandard  : Boolean,
  isPremium :  Boolean

  phoneNumber : string;
  isDeleted: boolean;
  lastPasswordChange: Date;
  isResetPassword: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | undefined;
  stripe_subscription_id : string | null;
  trialStartDate: Date | undefined;
  trialEndDate: Date | undefined;
  trialPlanType: TSubscription | undefined;

  walletId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type TUser = {
  _userId: undefined | Types.ObjectId;
  _id:  undefined; // Types.ObjectId |
  profileId : Types.ObjectId | undefined;
  // fullName: string;
  name: string;
  email: string;
  password: string;
  status: TStatusType.active | TStatusType.inactive;
  subscriptionType : TSubscription; 
  // TSubscription.standard |
  // TSubscription.standardPlus | TSubscription.vise 
  hasUsedFreeTrial: boolean;
  // freeTrialStartDate: Date;
  // freeTrialEndDate: Date;
  profileImage?: TProfileImage;
  fcmToken : string;
  stripe_customer_id: string;
  stripeConnectedAccount: string; // from kappes backend 
  role: Role;

  trialStartDate: Date | undefined;
  trialEndDate: Date | undefined;
  trialPlanType: TSubscription | undefined;

  isEmailVerified: boolean;
  isVip  : Boolean,
  isStandard  : Boolean,
  isPremium :  Boolean

  stripe_subscription_id : string | null;
  phoneNumber : string;
  isDeleted: boolean;
  lastPasswordChange: Date;
  isResetPassword: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserModal extends Model<TUser> {
  paginate: (
    filter: object,
    options: PaginateOptions,
  ) => Promise<PaginateResult<TUser>>;
  isExistUserById(id: string): Promise<Partial<TUser> | null>;
  isExistUserByEmail(email: string): Promise<Partial<TUser> | null>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
}
