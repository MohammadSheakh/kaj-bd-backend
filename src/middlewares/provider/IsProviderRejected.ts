//@ts-ignore
import { Request, Response, NextFunction } from 'express';
import sendResponse from '../../shared/sendResponse';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ServiceProvider } from '../../modules/service.module/serviceProvider/serviceProvider.model';
import { IServiceProvider } from '../../modules/service.module/serviceProvider/serviceProvider.interface';
import { TProviderApprovalStatus } from '../../modules/user.module/userRoleData/userRoleData.constant';

/** ----------------------------------------------
 * @role Provider
 * @Section 
 * @module 
 * @figmaIndex 
 * @desc 
 * 
 *----------------------------------------------*/
export const IsProviderRejected = <T> () => {
  return async (req: Request, res:Response, next:NextFunction) => {
    
    // const filtersParam = req.query || ''; // Get filters query param

    if (!req.user) {
      sendResponse(res, {
        code: StatusCodes.UNAUTHORIZED,
        message: 'You are not authorized',
        success: false,
      });
      return;
    }

    // check providerApprovalStatus from User Role Data Table
    
    // check providerApprovalStatus from Service Provider Details Table

    const serviceProviderDetails : IServiceProvider = await ServiceProvider.findOne({
        providerId: req.user.userId
    })

    // console.log("serviceProviderDetails :: ", serviceProviderDetails);

    if (!serviceProviderDetails) {
      sendResponse(res, {
        code: StatusCodes.UNAUTHORIZED,
        message: 'No Service Provider Details Found For this Person.',
        success: false,
      });
      return;
    }

    if(serviceProviderDetails.providerApprovalStatus == TProviderApprovalStatus.reject){
        sendResponse(res, {
            code: 555,
            message: 'You are blocked by admin.',
            success: false,
        });
        return;
    }

    // Proceed to the next middleware or controller if validation passes
    next();
  };
};
