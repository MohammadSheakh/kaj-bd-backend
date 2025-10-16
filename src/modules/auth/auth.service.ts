//@ts-ignore
import moment from 'moment';
//@ts-ignore
import mongoose from "mongoose";
import ApiError from '../../errors/ApiError';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import eventEmitterForOTPCreateAndSendMail, { OtpService } from '../otp/otp.service';
import { User } from '../user.module/user/user.model';
//@ts-ignore
import bcryptjs from 'bcryptjs';
import { TUser } from '../user.module/user/user.interface';
import { config } from '../../config';
import { TokenService } from '../token/token.service';
import { TokenType } from '../token/token.interface';
import { OtpType } from '../otp/otp.interface';
import { UserProfile } from '../user.module/userProfile/userProfile.model';
import { WalletService } from '../wallet.module/wallet/wallet.service';
import { TCurrency } from '../../enums/payment';

let walletService = new WalletService();
//@ts-ignore
import EventEmitter from 'events';
import { enqueueWebNotification } from '../../services/notification.service';
import { TRole } from '../../middlewares/roles';
import { TNotificationType } from '../notification/notification.constants';
import { SpecialistPatient } from '../personRelationships.module/specialistPatient/specialistPatient.model';
const eventEmitterForUpdateUserProfile = new EventEmitter(); // functional way
const eventEmitterForCreateWallet = new EventEmitter();
const eventEmitterForAssignSpecialistAutomatically = new EventEmitter();


eventEmitterForUpdateUserProfile.on('eventEmitterForUpdateUserProfile', async (valueFromRequest: any) => {
  try {
      const { userProfileId, userId } = valueFromRequest;
      await UserProfile.findByIdAndUpdate(userProfileId, { userId });
    }catch (error) {
      console.error('Error occurred while handling token creation and deletion:', error);
    }
});

export default eventEmitterForUpdateUserProfile;

eventEmitterForAssignSpecialistAutomatically.on('eventEmitterForAssignSpecialistAutomatically', 
  async (valueFromRequest: any) => {
  try {
      const { userId } = valueFromRequest; // this userId is patientId

      /********* Version 1️⃣
      
      // Step 1️⃣ Find all specialists
      const specialists = await User.find({ role: 'specialist', isActive: true });

      if (!specialists.length) {
        throw new Error('No available specialists found.');
      }

      // Step 2️⃣ Count relations per specialist
      const relationCounts = await SpecialistPatient.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$specialistId', totalPatients: { $sum: 1 } } },
      ]);
      console.log("relationCounts :: ", relationCounts)

      // Create a quick lookup map
      const specialistCountMap: Record<string, number> = {};
      for (const r of relationCounts) {
        specialistCountMap[r._id.toString()] = r.totalPatients;
      }

      console.log("specialistCountMap :: ", specialistCountMap)

      // Step 3️⃣ Pick specialist with least patients
      let leastLoadedSpecialist = specialists[0];
      let minCount = specialistCountMap[specialists[0]._id.toString()] || 0;

      for (const sp of specialists) {
        const count = specialistCountMap[sp._id.toString()] || 0;
        if (count < minCount) {
          minCount = count;
          leastLoadedSpecialist = sp;
        }
      }

      // Step 4️⃣ Create new relation
      const newRelation = await SpecialistPatient.create({
        userId,
        specialistId: leastLoadedSpecialist._id,
        relationCreatedBy: 'system',
      });

      console.log(
        `✅ Assigned patient ${userId} to specialist ${leastLoadedSpecialist._id} (has ${minCount} patients).`
      );
      ****** */


      // Step 1️⃣ Find the specialist with the least patients (lowest relation count)
      const leastLoaded = await SpecialistPatient.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$specialistId', count: { $sum: 1 } } },
        { $sort: { count: 1 } },
        { $limit: 1 },
      ]);

      let specialistId: mongoose.Types.ObjectId | null = null;

      if (leastLoaded.length > 0) {
        // Found one with least count
        specialistId = leastLoaded[0]._id;
      } else {
        // No relations yet → assign any active specialist
        const fallbackSpecialist = await User.findOne({ role: 'specialist', isActive: true }).select('_id');
        if (!fallbackSpecialist) {
          throw new Error('No available specialists found.');
        }
        specialistId = fallbackSpecialist._id;
      }

      // Step 2️⃣ Create the relation
      const existingRelation = await SpecialistPatient.findOne({
        patientId:userId,
        specialistId,
        isDeleted: false,
      });

      if (existingRelation) {
        console.log('ℹ️ Patient already assigned to this specialist.');
        return existingRelation;
      }

      const relation = await SpecialistPatient.create({
        patientId : userId,
        specialistId,
        relationCreatedBy: 'system', // optional: can also be 'admin' or 'patient'
      });

      console.log(
        `✅ Patient ${userId} assigned to specialist ${specialistId.toString()} successfully.`
      );

    }catch (error) {
      console.error('Error occurred while assigning specialist automatically:', error);
    }
});


eventEmitterForCreateWallet.on('eventEmitterForCreateWallet', async (valueFromRequest: any) => {
  try {
      const { userId } = valueFromRequest;
      
      const wallet =  await walletService.create({
        userId: userId,
        amount: 0, // default 0
        currency: TCurrency.usd,
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



const validateUserStatus = (user: TUser) => {
  if (user.isDeleted) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Your account has been deleted. Please contact support',
    );
  }
};
const createUser = async (userData: TUser, userProfileId:string) => {
  
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

  // ⚠️ bad code .. 
  // await UserProfile.findByIdAndUpdate(userProfileId, { userId: user._id });

  // 📈⚙️ OPTIMIZATION: with event emmiter 
  eventEmitterForUpdateUserProfile.emit('eventEmitterForUpdateUserProfile', { 
    userProfileId,
    userId : user._id
   });

  /************
  
  //create verification email token
  const verificationToken = await TokenService.createVerifyEmailToken(user);
  //create verification email otp
  const {otp} = await OtpService.createVerificationEmailOtp(user.email);
  
  *********** */

  /************
  // Run token and OTP creation in parallel
  const [verificationToken, { otp }] = await Promise.all([
    TokenService.createVerifyEmailToken(user),
    OtpService.createVerificationEmailOtp(user.email)
  ]);

  *********** */

  if(userData.role !== 'patient'){

  /***********
   * 
   * For first time registation .. for doctor and specialist .. we dont want to 
   * send otp to them .. 
   * we automatically verify their email from admin panel .. 
   * 
   * TODO : we will do this .. in admin panel
   * 
   * ********* */

    // 📈⚙️ OPTIMIZATION: with event emmiter 
    eventEmitterForCreateWallet.emit('eventEmitterForCreateWallet', { 
      userId : user._id
    });

    

    /********
     * 
     * Lets send notification to admin that new doctor or specialist registered
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
      // TTransactionFor.TrainingProgramPurchase, // referenceFor
      // purchaseTrainingProgram._id // referenceId
    );
    
    return { user };
  }

  ///////////////////////////////////////// ⚔️💪🏔️  // 📈⚙️ OPTIMIZATION:
  // if patient .. then we need to assign a specialist to him automatically 
  ////////////////////////////////////////

  eventEmitterForAssignSpecialistAutomatically.emit('eventEmitterForAssignSpecialistAutomatically', { 
    userId : user._id
  });

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

const login = async (email: string, reqpassword: string, fcmToken : string) => {
  const user = await User.findOne({ email }).select('+password');
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
    // user.fcmToken = fcmToken;



    await user.save();
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const tokens = await TokenService.accessAndRefreshToken(user);

  if(fcmToken){
    user.fcmToken = fcmToken;
    await user.save();  // INFO :  ekhane fcmToken save kora hocche 
  }

  const { password, ...userWithoutPassword } = user.toObject();

  return {
    userWithoutPassword,
    tokens,
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
  await OtpService.createResetPasswordOtp(user.email);
  user.isResetPassword = true;
  await user.save();
  return { resetPasswordToken };
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
