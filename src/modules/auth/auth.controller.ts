//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';
import { AttachmentService } from '../attachments/attachment.service';
import { UserProfile } from '../user.module/userProfile/userProfile.model';
import { TRole } from '../../middlewares/roles';
import { TFolderName } from '../../enums/folderNames';
import { WalletService } from '../wallet.module/wallet/wallet.service';
//@ts-ignore
import { Request, Response } from "express";
import { User } from '../user/user.model';
import { TAuthProvider } from './auth.constant';
import { TokenService } from '../token/token.service';
import { OAuthAccount } from '../user.module/oauthAccount/oauthAccount.model';
import { IUser } from '../user/user.interface';


//[🚧][🧑‍💻✅][🧪] // 🆗 
const register = catchAsync(async (req :Request, res:Response) => {

  //---------------------------------
  // Role jodi Doctor / Specialist hoy .. taile doctor er jonno document upload korar bebostha 
  // korte hobe .. 
  //---------------------------------

  let attachments = [];
  
  if (req.files && req.files.attachments) {
  attachments.push(
      ...(await Promise.all(
      req.files.attachments.map(async file => {
          const attachmenId = await new AttachmentService().uploadSingleAttachment(
              file, // file to upload 
              TFolderName.user, // folderName
          );
          return attachmenId;
      })
      ))
  );
  }

  req.body.attachments =  [...attachments];

  /****
   * 
   * if attachments are provided .. then we have to create profile and .. get that profile id
   * to save that into User model ... 
   * 
   * *** */
  const userProfile = await UserProfile.create({
    attachments: req.body.attachments,
    approvalStatus : req.body.role == TRole.patient ? 'approved' : 'pending'
  });

  req.body.profileId = userProfile._id;

  //---------------------------------
  // lets create wallet for  doctor and specialist but we do this in AuthService.createUser function 
  //---------------------------------

  const result = await AuthService.createUser(req.body, userProfile._id);

  if(req.body.role == 'doctor' || req.body.role == 'specialist') {

    //---------------------------------
    // we already created wallet for doctor and specialist in AuthService.createUser function
    //---------------------------------
    sendResponse(res, {
      code: StatusCodes.CREATED,
      message: `Account create successfully. After checking your documents, you will be notified by email.`,
      data: result,
      success: true,
    });
  } 

  sendResponse(res, {
    code: StatusCodes.CREATED,
    message: `Account create successfully, Please verify your email to login`,
    data: result,
    success: true,
  });

  
});

const login = catchAsync(async (req :Request, res:Response) => {
  const { email, password, fcmToken } = req.body;
  const result = await AuthService.login(email, password, fcmToken);

  //set refresh token in cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // set maxAge to a number
    sameSite: 'lax',
  });

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: result,
    success: true,
  });
});

// Google Login
const googleLogin = async (req :Request, res:Response) => {
  const { googleId, email, googleAccessToken } = req.body;

  // // Check 1: Is there already a LOCAL account with this email?
  // let localUser = await User.findOne({ email: "you@gmail.com", hashedPassword: { $ne: null }});

  // Check 2: Is there already a GOOGLE account with this providerId?
  const existingOAuth = await OAuthAccount.findOne({ 
    authProvider: TAuthProvider.google, 
    providerId: googleId 
  });

  //CASE-1 if google Account already exist -> no new acc.. login 
  //CASE-2 local account exists with same email -> link or prompt
  /*************
  Option 1 (Recommended): Auto-link if email is verified
  If Google says the email is verified (isVerified: true),
  and your local account also has isEmailVerified: true, then: 
  |-> do not create new user
  |-> Link the Google OAuth account to the existing user
  |-> Now user can log in with both password AND Google

  **************/
 // CASE-3 No existing account → create new user


 if (existingOAuth) {
    // Log in existing user
    const tokens = await TokenService.accessAndRefreshToken(user);
    const { password, ...userWithoutPassword } = user.toObject();

    sendResponse(res, {
      code: StatusCodes.OK,
      message: 'User logged in via Google successfully',
      data: { userWithoutPassword, tokens },
      success: true,
    });
  } else {
    // Check for existing user by email (if email is verified!)
    // const existingUser = await User.findOne({ email: profile.email });
    
    // Check 1: Is there already a LOCAL account with this email?
    let existingUser:IUser = await User.findOne({ email: "you@gmail.com"});

    if (existingUser && existingUser.isEmailVerified) {

    //@ts-ignore
    ```
    Never auto-link if:

    The OAuth provider didn’t verify the email (e.g., Apple may hide
    it) Your local account isn’t email-verified

    “Sign up as ceo@yourcompany.com with password → not verified”
    “Then log in via Google as themselves, but claim ceo@yourcompany.com”
    → And take over the account! 

    ```

      // Link OAuth to existing user
      await OAuthAccount.create({
        userId: existingUser._id,
        authProvider: TAuthProvider.google,
        providerId: profile.sub,
        email: profile.email,
        isVerified: true
      });
      // Log in existingUser

      const tokens = await TokenService.accessAndRefreshToken(existingUser);
      const { password, ...userWithoutPassword } = existingUser.toObject();

      sendResponse(res, {
        code: StatusCodes.OK,
        message: 'User logged in via Google successfully',
        data: { userWithoutPassword, tokens },
        success: true,
      });


    } else {
      // Create new user
      const newUser = new User({ email: profile.email });
      await newUser.save();
      // Create OAuthAccount linked to newUser
    }
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in via Google successfully',
    data: { userWithoutPassword, tokens },
    success: true,
  });
};

// Apple Login
const appleLogin = async (req :Request, res:Response) => {
  const { appleId, email, appleAccessToken } = req.body;

  let user = await User.findOne({ appleId });

  if (!user) {
    // New user, register them
    const newUser = await AuthService.createUser({
      email,
      appleId,
      authProvider: TAuthProvider.apple,
      appleAccessToken,
    });

    return sendResponse(res, {
      code: StatusCodes.CREATED,
      message: 'User registered via Apple successfully',
      data: newUser,
      success: true,
    });
  }

  // Existing user, update the access token and login
  user.appleAccessToken = appleAccessToken;
  await user.save();

  const tokens = await TokenService.accessAndRefreshToken(user);
  const { password, ...userWithoutPassword } = user.toObject();

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in via Apple successfully',
    data: { userWithoutPassword, tokens },
    success: true,
  });
};

//[🚧][🧑‍💻✅][🧪]  // 🆗
const verifyEmail = catchAsync(async (req :Request, res:Response) => {
  console.log(req.body);
  const { email, token, otp } = req.body;
  const result = await AuthService.verifyEmail(email, token, otp);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Email verified successfully',
    data: {
      result,
    },
    success: true,
  });
});

const resendOtp = catchAsync(async (req :Request, res:Response) => {
  const { email } = req.body;
  const result = await AuthService.resendOtp(email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Otp sent successfully',
    data: result,
    success: true,
  });
});
const forgotPassword = catchAsync(async (req :Request, res:Response) => {
  const result = await AuthService.forgotPassword(req.body.email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset email sent successfully',
    data: result,
    success: true,
  });
});

const changePassword = catchAsync(async (req :Request, res:Response) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;
  const result = await AuthService.changePassword(
    userId,
    currentPassword,
    newPassword,
  );
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password changed successfully',
    data: result,
    success: true,
  });
});
const resetPassword = catchAsync(async (req :Request, res:Response) => {
  const { email, password, otp } = req.body;
  const result = await AuthService.resetPassword(email, password, otp);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset successfully',
    data: {
      result,
    },
    success: true,
  });
});

const logout = catchAsync(async (req :Request, res:Response) => {
  await AuthService.logout(req.body.refreshToken);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged out successfully',
    data: {},
  });
});

const refreshToken = catchAsync(async (req :Request, res:Response) => {
  const tokens = await AuthService.refreshAuth(req.body.refreshToken);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: {
      tokens,
    },
  });
});

export const AuthController = {
  register,
  login,
  googleLogin,
  appleLogin,
  verifyEmail,
  resendOtp,
  logout,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
};
