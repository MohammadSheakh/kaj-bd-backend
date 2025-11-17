//@ts-ignore
import moment from 'moment';
//@ts-ignore
import mongoose from "mongoose";
import ApiError from '../../errors/ApiError';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import eventEmitterForOTPCreateAndSendMail, { OtpService } from '../otp/otp.service';
//@ts-ignore
import bcryptjs from 'bcryptjs';
import { config } from '../../config';
import { TokenService } from '../token/token.service';
import { TokenType } from '../token/token.interface';
import { OtpType } from '../otp/otp.interface';
import { WalletService } from '../wallet.module/wallet/wallet.service';
import { TCurrency } from '../../enums/payment';

//@ts-ignore
import EventEmitter from 'events';
import { enqueueWebNotification } from '../../services/notification.service';
import { TRole } from '../../middlewares/roles';
import { TNotificationType } from '../notification/notification.constants';
import { UserProfile } from '../user.module/userProfile/userProfile.model';
import { User } from '../user.module/user/user.model';
import { UserDevices } from '../user.module/userDevices/userDevices.model';
import { IUserDevices } from '../user.module/userDevices/userDevices.interface';
import { ICreateUser } from './auth.constants';
import { UserRoleDataService } from '../user.module/userRoleData/userRoleData.service';
import { TProviderApprovalStatus } from '../user.module/userRoleData/userRoleData.constant';
import { IUser } from '../user.module/user/user.interface';
import { IServiceProvider } from '../service.module/serviceProvider/serviceProvider.interface';
import { ServiceProvider } from '../service.module/serviceProvider/serviceProvider.model';
import { IUserRoleData } from '../user.module/userRoleData/userRoleData.interface';
import { UserRoleData } from '../user.module/userRoleData/userRoleData.model';
const eventEmitterForUpdateUserProfile = new EventEmitter(); // functional way
const eventEmitterForCreateWallet = new EventEmitter();

let walletService = new WalletService();
let userRoleDataService = new UserRoleDataService();

eventEmitterForUpdateUserProfile.on('eventEmitterForUpdateUserProfile', async (valueFromRequest: any) => {
  try {
      const { userProfileId, userId } = valueFromRequest;
      await UserProfile.findByIdAndUpdate(userProfileId, { userId });
    }catch (error) {
      console.error('Error occurred while handling token creation and deletion:', error);
    }
});

export default eventEmitterForUpdateUserProfile;




eventEmitterForCreateWallet.on('eventEmitterForCreateWallet', async (valueFromRequest: any) => {
  try {
      const { userId } = valueFromRequest;
      
      const wallet =  await walletService.create({
        userId: userId,
        amount: 0, // default 0
        currency: TCurrency.bdt,
      });

      await User.findByIdAndUpdate(
        userId,
        { walletId: wallet._id },
        { new: true }
      )

    }catch (error) {
      console.error('Error occurred while handling token creation and deletion:', error);
    }
});



const validateUserStatus = (user: IUser) => {
  if (user.isDeleted) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Your account has been deleted. Please contact support',
    );
  }
};
const createUser = async (userData: ICreateUser, userProfileId:string) => {
  
  const existingUser = await User.findOne({ email: userData.email });
  
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
    } else {
      await User.findOneAndUpdate({ email: userData.email }, userData);

      //create verification email token
      const verificationToken =
        await TokenService.createVerifyEmailToken(existingUser);
      //create verification email otp
      await OtpService.createVerificationEmailOtp(existingUser.email);
      return { verificationToken };
    }
  }

  const user = await User.create(userData);


  // 📈⚙️ OPTIMIZATION: with event emmiter 
  eventEmitterForUpdateUserProfile.emit('eventEmitterForUpdateUserProfile', { 
    userProfileId,
    userId : user._id
  });

  if(userData.role === TRole.provider){

  /*---------------------------
   * For first time registation .. for provider .. we dont want to 
   * send otp to them .. 
   * we automatically verify their email from admin panel ..
   * TODO : we will do this .. in admin panel
   * ------------------------- */

    // 📈⚙️ OPTIMIZATION: with event emmiter 
    eventEmitterForCreateWallet.emit('eventEmitterForCreateWallet', { 
      userId : user._id
    });

    /********
     * TODO : MUST
     * Lets send notification to admin that new Provider registered
     * 
     * ***** */
    await enqueueWebNotification(
      `A ${userData.role} registered successfully . verify document to activate account`,
      null, // senderId
      null, // receiverId 
      TRole.admin, // receiverRole
      TNotificationType.newUser, // type
      /**********
       * In UI there is no details page for specialist's schedule
       * **** */
      // '', // linkFor
      // existingWorkoutClass._id // linkId
    );

    //--------- Lets create UserRole Data 
    await userRoleDataService.create({
      userId: user._id,
      // providerApprovalStatus : TProviderApprovalStatus.pending, // we make this pending  later in serviceProvider Data Create part
    })
    
    return { user };
  }

  // , { otp }
  // Run token and OTP creation in parallel
  const [verificationToken] = await Promise.all([
    TokenService.createVerifyEmailToken(user),
    // OtpService.createVerificationEmailOtp(user.email)
  ]);


  eventEmitterForOTPCreateAndSendMail.emit('eventEmitterForOTPCreateAndSendMail', { email: user.email });

  // , otp
  return { user, verificationToken  }; // FIXME  : otp remove korte hobe ekhan theke .. 
};

// local login
const login = async (email: string, 
  reqpassword: string,
  fcmToken? : string,
  deviceInfo?: { deviceType?: string, deviceName?: string }
) => {
  const user:IUser = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  validateUserStatus(user);

  // if (!user.isEmailVerified) {
  //   //create verification email token
  //   const verificationToken = await TokenService.createVerifyEmailToken(user);
  //   //create verification email otp
  //   await OtpService.createVerificationEmailOtp(user.email);
  //   return { verificationToken };

  //   throw new ApiError(
  //     StatusCodes.BAD_REQUEST,
  //     'User not verified, Please verify your email, Check your email.'
  //   );
  // }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      `Account is locked. Try again after ${config.auth.lockTime} minutes`,
    );
  }

  const isPasswordValid = await bcryptjs.compare(reqpassword, user.password);
  if (!isPasswordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= config.auth.maxLoginAttempts) {
      user.lockUntil = moment().add(config.auth.lockTime, 'minutes').toDate();
      await user.save();
      throw new ApiError(
        423,
        `Account locked for ${config.auth.lockTime} minutes due to too many failed attempts`,
      );
    }

    await user.save();
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const tokens = await TokenService.accessAndRefreshToken(user);

  // ✅ Save FCM token in UserDevices
  if (fcmToken) {
    const deviceType = deviceInfo?.deviceType || 'web';
    const deviceName = deviceInfo?.deviceName || 'Unknown Device';

    // Find or create device record
    let device:IUserDevices = await UserDevices.findOne({
      userId: user._id,
      fcmToken,
    });

    if (!device) {
      device = await UserDevices.create({
        userId: user._id,
        fcmToken,
        deviceType,
        deviceName,
        lastActive: new Date(),
      });
    } else {
      // Update last active
      device.lastActive = new Date();
      await device.save();
    }
  }

  const { password, ...userWithoutPassword } = user.toObject();

  /*-----------------
    now we need to check if logged in user is provider .. 
    if provider .. then we return isFilledUp and approvalStatus
    is Filled Up should be boolean .. 
    true or false .. 

    and if providerApprovalStatus 
    is "requested" wating for approval..
    "reject"   show rejection page that admin rejected this profile
    "pending"  can log in .. just for 
    
  -------------------*/

  let isServiceProviderDetailsFound : boolean = false;
  if(user.role == TRole.provider){
    console.log("user.role == provider");
    const serviceProviderDetails : IServiceProvider | null = await ServiceProvider.findOne({
      providerId : user._id,
    })
    
    if(serviceProviderDetails){
      isServiceProviderDetailsFound = true;
    }
  }

  let providerApprovalStatusFromUsersRoleData = null

  let usersRoleData : IUserRoleData | null = await UserRoleData.findOne({
    userId :  user._id,
  }).select("providerApprovalStatus");

  if(usersRoleData){
    providerApprovalStatusFromUsersRoleData = usersRoleData.providerApprovalStatus;
  }

  if(providerApprovalStatusFromUsersRoleData == TProviderApprovalStatus.reject){
    throw new ApiError(StatusCodes.FORBIDDEN, 'Admin rejected this profile.');
  }

  if(providerApprovalStatusFromUsersRoleData == TProviderApprovalStatus.requested){
    throw new ApiError(StatusCodes.FORBIDDEN, 'Please Wait For Admins Approval.');
  }

  // approval status pending or approved hoile login korte parbe ..
  // register korar pore pending thakbe .. karon .. jate providerDetailsForm Fill up 
  // korte pare .. 
  // providerDetailsForm Fill up korle .. approvalStatus "requested" hoye jabe ..
  // er pore provider ar login korte parbe na .. etai hocche flow .. 

  return {
    userWithoutPassword,
    tokens,
    isServiceProviderDetailsFound,
    providerApprovalStatusFromUsersRoleData
  };
};

//[🚧][🧑‍💻✅][🧪]  // 🆗
const verifyEmail = async (email: string, token: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  await TokenService.verifyToken(
    token,
    config.token.TokenSecret,
    user?.isResetPassword ? TokenType.RESET_PASSWORD : TokenType.VERIFY,
  );

  //verify otp
  await OtpService.verifyOTP(
    user.email,
    otp,
    user?.isResetPassword ? OtpType.RESET_PASSWORD : OtpType.VERIFY,
  );

  user.isEmailVerified = true;
  await user.save();

  const tokens = await TokenService.accessAndRefreshToken(user);
  return {user, tokens} ;
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  //create reset password token
  const resetPasswordToken = await TokenService.createResetPasswordToken(user);
  const otp = await OtpService.createResetPasswordOtp(user.email);
  user.isResetPassword = true;
  await user.save();
  return { resetPasswordToken, otp }; // TODO : MUST : REMOVE THIS
};

const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user?.isResetPassword) {
    const resetPasswordToken =
      await TokenService.createResetPasswordToken(user);
    await OtpService.createResetPasswordOtp(user.email);
    return { resetPasswordToken };
  }
  const verificationToken = await TokenService.createVerifyEmailToken(user);
  await OtpService.createVerificationEmailOtp(user.email);
  return { verificationToken };
};

const resetPassword = async (
  email: string,
  newPassword: string,
  otp: string,
) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  await OtpService.verifyOTP(
    user.email,
    otp,
    user?.isResetPassword ? OtpType.RESET_PASSWORD : OtpType.VERIFY,
  );
  user.password = newPassword;
  user.isResetPassword = false;
  await user.save();
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};
const logout = async (refreshToken: string) => {};

const refreshAuth = async (refreshToken: string) => {};

export const AuthService = {
  createUser,
  login,
  verifyEmail,
  resetPassword,
  forgotPassword,
  resendOtp,
  logout,
  changePassword,
  refreshAuth,
};
