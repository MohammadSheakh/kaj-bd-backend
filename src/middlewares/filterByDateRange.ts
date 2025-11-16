//@ts-ignore
import { Request, Response, NextFunction } from 'express';
import ApiError from '../errors/ApiError';

//---------------------------------
// this middleware will set the 
// req.query.createdAt = {
//        $gte: fromDate,
//        $lte: toDate
//      };
//
//  so in req.query .. we need to send from and to
//  may be it works fine without aggregation 
//--------------------------------- 
export const filterByDateRange = <T> () => {
  return (req: Request, res:Response, next:NextFunction) => {
    

    if (req.query.from && req.query.to) {
      const from = `${req.query.from}T00:00:00.000Z`;
      const to   = `${req.query.to}T23:59:59.999Z`;

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
      }

      req.query.createdAt = {
        $gte: fromDate,
        $lte: toDate
      };
    }

    delete req.query.from;
    delete req.query.to;

    next();
  };
};