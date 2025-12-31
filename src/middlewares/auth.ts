import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import { roleRights, TRole } from './roles';
import { User } from '../modules/user.module/user/user.model';
import ApiError from '../errors/ApiError';
import catchAsync from '../shared/catchAsync';
import { config } from '../config';
import { TokenType } from '../modules/token/token.interface';
import { TokenService } from '../modules/token/token.service';
import { IUser } from '../modules/user.module/user/user.interface';
import { IUserProfile } from '../modules/user.module/userProfile/userProfile.interface';
import { UserProfile } from '../modules/user.module/userProfile/userProfile.model';
import { TApprovalStatus } from '../modules/user.module/userProfile/userProfile.constant';

const auth = (...roles: TRole[]/******** Previously it was string[] */) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Step 1: Get Authorization Header
    const tokenWithBearer = req.headers.authorization;
    if (!tokenWithBearer) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }
    if (tokenWithBearer.startsWith('Bearer')) {
      const token = tokenWithBearer.split(' ')[1];
      // Step 2: Verify Token
      const verifyUser = await TokenService.verifyToken(
        token,
        config.jwt.accessSecret as Secret,
        TokenType.ACCESS
      );
      // Step 3: Attach user to the request object
      req.user = verifyUser;

      // Step 4: Check if the user exists and is active
      const user:IUser = await User.findById(verifyUser?.userId);
      // TODO : MUST :: now userProfile does not contain information about approvalStatus and status
      
      if (!user) {
        // user not found
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized.');
      }
      
      // SO ... FIx this .. 
      const userProfile : IUserProfile = await UserProfile.findById(user?.profileId);

      if(!userProfile){
        // User profile not found. Please Log In again.
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized.');
      }

       
      //------------------- As per khairul vai .. he is not designed this verification page .. 
      // else if (!user.isEmailVerified) {
      //   throw new ApiError(
      //     StatusCodes.BAD_REQUEST,
      //     'Your account is not email verified. please verify your email'
      //   );
      // } 
      
      // TODO : MUST FIX for Kaj Bd 
      // else if (user.role !== 'patient' && userProfile.approvalStatus == TApprovalStatus.pending){
      //     throw new ApiError(
      //     StatusCodes.BAD_REQUEST,
      //     'Your account is not approved by admin. please wait for admin approval or contact support'
      //   );
      // }else if (user.role !== 'patient' && userProfile.approvalStatus == TApprovalStatus.rejected){
      //     throw new ApiError(
      //     StatusCodes.BAD_REQUEST,
      //     'Your account is rejected by admin. please contact support'
      //   );
      // }

      // Step 5: Role-based Authorization
      if (roles.length) {
        const userRole = roleRights.get(verifyUser?.role);
        const hasRole = userRole?.some(role => roles.includes(role));
        if (!hasRole) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            `You don't have permission to access this API ${user.name} | ${user._id} | ${user.role} | ${req.originalUrl}`
          );
        }
      }

      next();
    } else {
      // If the token format is incorrect
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }
  });

export default auth;
