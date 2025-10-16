//@ts-ignore
import { model, Schema, Types } from 'mongoose';
import { TProfileImage, TUser, UserModal } from './user.interface';
import paginate from '../../../common/plugins/paginate';
//@ts-ignore
import bcryptjs from 'bcryptjs';
import { config } from '../../../config';
import { TStatusType } from './user.constant';
import { Roles } from '../../../middlewares/roles';
import { TSubscription } from '../../../enums/subscription';

// Profile Image Schema
const profileImageSchema = new Schema<TProfileImage>({
  imageUrl: {
    type: String,
    required: [true, 'Image url is required'],
    default: '/uploads/users/user.png',
  },
});

// User Schema Definition
const userSchema = new Schema<TUser, UserModal>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    profileId: { //🔗 as doctor and specialist need to upload documents.. 
      type: Types.ObjectId,
      ref: 'UserProfile',
      required: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    profileImage: {
      type: profileImageSchema,
      required: false,
      default: { imageUrl: '/uploads/users/user.png' },
    },

    fcmToken: { type: String, default: null }, // Store Firebase Token

    //---------------------------------
    // TODO: Add once gula kivabe manage korbo chinta korte hobe .. 
    //---------------------------------
    subscriptionType: {
      type: String,
      enum: TSubscription 
      // [
      //     TSubscription.none,
      //     TSubscription.freeTrial,
      //     TSubscription.standard,
      //     TSubscription.standardPlus,
      //     TSubscription.vise
      // ]
      ,
      required: [
        false,
        `TSubscription is required it can be ${Object.values(
          TSubscription
        ).join(', ')}`,
      ],
      default: TSubscription.none, 
    },

    // 🆓 FREE TRIAL TRACKING
    hasUsedFreeTrial: { //✅ TRIAL_USED (prevent multiple trials)
      type: Boolean,
      default: false,
    },
    /********
     * for free trial .. we dont need to create 
     * a USER_SUBSCRIPTION document .. we can just track this
     * in USER model
     * ****** */
    trialStartDate: {
      type: Date,
      default: null,
    },
    trialEndDate : {
      type: Date,
      default: null,
    },
    trialPlanType:{/**** 
      for which plan we start trial
      because after trial end we need to create 
      a userSubscription document ..
      *****/
      type: String,
      enum: [
        TSubscription.standard,
      ],
      default: null,
    },

    status : {
      type: String,
      enum:  [TStatusType.active, TStatusType.inactive],
      required: [
        false,
        `Status is required it can be ${Object.values(
          TStatusType
        ).join(', ')}`,
      ],
      default: TStatusType.active,
    },

    role: {
      type: String,
      enum: {
        values: Roles,
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber : {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    lastPasswordChange: { type: Date },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: { type: Date }, // 🔴 not sure 

    //---------------------------------
    // this is for Order Something .. Like Payment Related Thing .. 
    //---------------------------------

    stripe_customer_id: {
      // > stripe er customer id ...
      type: String,
      required: [
        false,
        'stripe_customer_id is not required',
      ],
      default: null,
    },

    stripe_subscription_id : { /*********
                                This is important .. 
                                ****** */
      type: String,
      required: [
        false,
        'stripe_subscription_id is not required',
      ],
      default: null,
    },

    //---------------------------------
    // From Kappes Backend .. 
    // For Sending and Receiving Money Via Stripe .. 
    //---------------------------------
    stripeConnectedAccount: {
      type: String,
      default: '',
    },

    //---------------------------------
    // Wallet Related Info
    //---------------------------------
    walletId : {
      type: Types.ObjectId,
      ref: 'Wallet',
      required: false, // patient dont need any wallet .. only doctor and specialist need wallet 
      default: null,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Apply the paginate plugin
userSchema.plugin(paginate);

// Static methods
userSchema.statics.isExistUserById = async function (id: string) {
  return await this.findById(id);
};

userSchema.statics.isExistUserByEmail = async function (email: string) {
  return await this.findOne({ email });
};

userSchema.statics.isMatchPassword = async function (
  password: string,
  hashPassword: string,
): Promise<boolean> {
  return await bcryptjs.compare(password, hashPassword);
};

// FIX : ts issue 
// Middleware to hash password before saving
userSchema.pre('save', async function (next) {

  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(
      this.password,
      Number(config.bcrypt.saltRounds),
    );
  }
  next();
});


// Use transform to rename _id to _projectId
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._userId = ret._id;  // Rename _id to _projectId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

// Export the User model
export const User = model<TUser, UserModal>('User', userSchema);
