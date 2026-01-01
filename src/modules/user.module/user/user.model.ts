//@ts-ignore
import { model, Schema, Types } from 'mongoose';
import { TProfileImage, IUser, UserModal } from './user.interface';
import paginate from '../../../common/plugins/paginate';
//@ts-ignore
import bcryptjs from 'bcryptjs';
import { config } from '../../../config';
import { TpreferredLanguage, TStatusType } from './user.constant';
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
const userSchema = new Schema<IUser, UserModal>(
  {
    profileId: { //🔗 dob, gender, acceptTOC, 3 different image 
      type: Types.ObjectId,
      ref: 'UserProfile',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
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
    role: {
      type: String,
      enum: {
        values: Roles,
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
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

    // fcmToken: { type: String, default: null }, 
    //-- now we Store Firebase Token into different table 

    //---------------------------------
    // INFO : we dont need subscriptionType in this kaj-bdi project this is from suplify 
    //---------------------------------
    
    
    //------- we move this status to different table
    //-------- as we have different status for different user
    // status : {  
    //   type: String,
    //   enum:  [TStatusType.active, TStatusType.inactive],
    //   required: [
    //     false,
    //     `Status is required it can be ${Object.values(
    //       TStatusType
    //     ).join(', ')}`,
    //   ],
    //   default: TStatusType.active,
    // },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber : { // TODO : add proper validation
      type: String,
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
    // Wallet Related Info
    //---------------------------------
    walletId : {
      type: Types.ObjectId,
      ref: 'Wallet',
      required: false, // user and admin dont need any wallet .. only provider need wallet 
      default: null,
    },

    //---------------------------------
    // Preferred Language
    //---------------------------------
    preferredLanguage: {
      type: String,
      enum: [TpreferredLanguage.en, TpreferredLanguage.bn],
      required: [false, 'preferredLanguage is not required'],
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
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

  // INFO : while running seeder .. comment this out 
  // if (this.isModified('password')) {
  //   this.password = await bcryptjs.hash(
  //     this.password,
  //     Number(config.bcrypt.saltRounds),
  //   );
  // }
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
export const User = model<IUser, UserModal>('User', userSchema);
