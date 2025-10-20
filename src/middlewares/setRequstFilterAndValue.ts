//@ts-ignore
import { Request, Response, NextFunction } from 'express';
import sendResponse from '../shared/sendResponse';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

//---------------------------------
// this middleware will set the req.query.<filter> = value ||||
// so that we can use it in the router to filter the data based on passed value
//--------------------------------- 💎✨🔍
export const setRequstFilterAndValue = <T> (filter: string, value: string) => {
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
    
    // TODO : if filter is provided when the request is made then we will use 
    // already provided filter and value
    // if (req.query[filter]) {
    //   return next();
    // }

    req.query[filter]  = value;
    req.query.isDeleted = false;

    // Proceed to the next middleware or controller if validation passes
    next();
  };
};


type FilterObject = Record<string, any>;


//------------------------ To use this middleware everywhere
// setRequestFiltersV2({
//     isDeleted: false,
//   }),
export const setRequestFiltersV2 = (filters: FilterObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // if (!req.user) {
    //   sendResponse(res, {
    //     code: StatusCodes.UNAUTHORIZED,
    //     message: 'You are not authorized',
    //     success: false,
    //   });
    //   return;
    // }

    // Merge filters into req.query
    // Only set if not already provided in the request
    Object.keys(filters).forEach(key => {
      if (!req.query[key]) {
        req.query[key] = filters[key];
      }
    });

    // Always set isDeleted to false if not provided
    if (!req.query.isDeleted) {
      req.query.isDeleted = 'false';
    }

    next();
  };
};