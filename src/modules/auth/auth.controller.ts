//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';
import { AttachmentService } from '../attachments/attachment.service';
import { UserProfile } from '../user/userProfile/userProfile.model';
import { TRole } from '../../middlewares/roles';
import { TFolderName } from '../../enums/folderNames';
import { WalletService } from '../wallet.module/wallet/wallet.service';
//@ts-ignore
import { Request, Response } from "express";


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
  verifyEmail,
  resendOtp,
  logout,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
};
