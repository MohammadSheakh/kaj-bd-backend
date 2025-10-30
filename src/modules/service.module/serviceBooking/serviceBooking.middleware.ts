//@ts-ignore
import { Request, Response, NextFunction } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ServiceBooking } from './serviceBooking.model';
import sendResponse from '../../../shared/sendResponse';
import { IServiceBooking } from './serviceBooking.interface';
import { TBookingStatus } from './serviceBooking.constant';
//@ts-ignore
import { differenceInHours } from 'date-fns';

export const checkUserCanCancelBooking = () => {
    return async(req: Request, res:Response, next:NextFunction) => {
        const booking:IServiceBooking = await ServiceBooking.findOne({
            _id : req.params.id,
        });

        if(!booking){
            sendResponse(res, {
                code: StatusCodes.NOT_FOUND,
                message: 'Booking not found',
                success: false,
            });
            return;
        }

        if(booking.status !== TBookingStatus.pending){
            sendResponse(res, {
                code: StatusCodes.BAD_REQUEST,
                message: 'You can not cancel this booking',
                success: false,
            });
            return;
        }

    
        // Calculate the difference in hours
        // const diffInMs = now.getTime() - bookingTime.getTime();
        // const diffInHours = diffInMs / (1000 * 60 * 60);

        // // Check if 4 hours have passed
        // if (diffInHours < 4) {

        const hoursPassed = differenceInHours(new Date(), new Date(booking.bookingDateTime));

        if (hoursPassed < 4) {
            return sendResponse(res, {
                code: StatusCodes.BAD_REQUEST,
                message: 'You can only cancel after 4 hours have passed since the booking time.',
                success: false,
            });
        }

        next();
    }
} 

export const checkProviderCanAcceptBooking = () => {
    return async(req: Request, res:Response, next:NextFunction) => {
        const booking:IServiceBooking = await ServiceBooking.findOne({
            _id : req.params.id,
        });

        if(!booking){
            sendResponse(res, {
                code: StatusCodes.NOT_FOUND,
                message: 'Booking not found',
                success: false,
            });
            return;
        }

        if(booking.status !== TBookingStatus.pending){
            sendResponse(res, {
                code: StatusCodes.BAD_REQUEST,
                message: 'You can not accept this booking',
                success: false,
            });
            return;
        }
    
        next();
    }
} 

export const checkProviderCanCancelBooking = () => {
    return async(req: Request, res:Response, next:NextFunction) => {
        const booking:IServiceBooking = await ServiceBooking.findOne({
            _id : req.params.id,
        });

        if(!booking){
            sendResponse(res, {
                code: StatusCodes.NOT_FOUND,
                message: 'Booking not found',
                success: false,
            });
            return;
        }

        if(booking.status !== TBookingStatus.pending){
            sendResponse(res, {
                code: StatusCodes.BAD_REQUEST,
                message: 'You can not cancel this booking',
                success: false,
            });
            return;
        }
    
        next();
    }
} 

// for start work
export const checkProviderCanMakeInProgressOfThisBooking = () => {
    return async(req: Request, res:Response, next:NextFunction) => {
        const booking:IServiceBooking = await ServiceBooking.findOne({
            _id : req.params.id,
        });

        if(!booking){
            sendResponse(res, {
                code: StatusCodes.NOT_FOUND,
                message: 'Booking not found',
                success: false,
            });
            return;
        }

        if(booking.status !== TBookingStatus.accepted){
            sendResponse(res, {
                code: StatusCodes.BAD_REQUEST,
                message: 'You can not start work on this booking',
                success: false,
            });
            return;
        }
    
        next();
    }
} 

export const checkProviderCanMakeRequestForPaymentOfThisBooking = () => {
    return async(req: Request, res:Response, next:NextFunction) => {
        const booking:IServiceBooking = await ServiceBooking.findOne({
            _id : req.params.id,
        });

        if(!booking){
            sendResponse(res, {
                code: StatusCodes.NOT_FOUND,
                message: 'Booking not found',
                success: false,
            });
            return;
        }

        if(booking.status !== TBookingStatus.inProgress){
            sendResponse(res, {
                code: StatusCodes.BAD_REQUEST,
                message: 'You can not make payment request for this booking',
                success: false,
            });
            return;
        }
    
        next();
    }
} 