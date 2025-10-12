//@ts-ignore
import { Types } from 'mongoose';
import { TSubscription } from '../../enums/subscription';

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'resetPassword',
  VERIFY = 'verify',
}
export interface IToken {
  _id: string;
  user?: Types.ObjectId;
  token: string;
  verified: boolean;
  expiresAt: Date;
  type: TokenType;
}

export interface IUser {
  userId: string | undefined;
  userName?: string;
  email: string;
  role: string;
  stripe_customer_id : string | null;
  subscriptionPlan : TSubscription | null; // ENUM
}

