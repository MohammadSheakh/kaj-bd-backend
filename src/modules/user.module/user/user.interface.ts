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
  name: string;
  email: string;
  role: Role;
  password: string;
  profileImage?: TProfileImage;
  isEmailVerified: boolean;
  phoneNumber : string;
  lastPasswordChange: Date;
  isResetPassword: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | undefined;


  walletId?: Types.ObjectId;

  isDeleted: boolean;
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateUserInfo{
  name?: string;
  email?: string;
  phoneNumber?: string;

  location: string;
  dob: Date;
  gender: string;
}

export interface UserModal extends Model<IUser> {
  paginate: (
    filter: object,
    options: PaginateOptions,
  ) => Promise<PaginateResult<IUser>>;
  isExistUserById(id: string): Promise<Partial<IUser> | null>;
  isExistUserByEmail(email: string): Promise<Partial<IUser> | null>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
}
