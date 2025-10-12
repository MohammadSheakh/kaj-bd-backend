//@ts-ignore
import { Request, Response, NextFunction } from 'express';
import sendResponse from '../shared/sendResponse';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

//---------------------------------
// this middleware will set the req.query.<referenceToUser> = req.user.userId ||||
// so that we can use it in the router to filter the data based on logged in user 
//---------------------------------
export const getLoggedInUserAndSetReferenceToUser = <T> (referenceToUser: string) => {
  return (req: Request, res:Response, next:NextFunction) => {
    
    // const filtersParam = req.query || ''; // Get filters query param

    if (!req.user) {
      sendResponse(res, {
        code: StatusCodes.UNAUTHORIZED,
        message: 'You are not authorized',
        success: false,
      });
      return;
    }

    req.query[referenceToUser]  = (req.user as any).userId;
    req.query.isDeleted = false;

    // Proceed to the next middleware or controller if validation passes
    next();
  };
};
