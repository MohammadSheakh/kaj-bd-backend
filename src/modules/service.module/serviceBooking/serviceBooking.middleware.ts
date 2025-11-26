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

import { TFolderName } from "../../../enums/folderNames";
//@ts-ignore
import multer from "multer";
import { processUploadedFilesForUpdate } from "../../../middlewares/processUploadedFiles";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


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



        // for update cases .. if image uploaded then we use that uploaded image url otherwise we use previous one
        if(req.uploadedFiles?.attachments.length > 0){
        console.log('req.uploadedFiles?.attachments.length > 0 .. replace prev image with the new one');
        req.body.attachments = [...req.uploadedFiles?.attachments, ...booking.attachments];
        }else{
        req.body.attachments = booking.attachments;
        }

        // ✅ Use preprocessed uploaded file URLs //🥇🔁 this task we do in middleware level for create API not for update API
        // req.body.attachments = req.uploadedFiles?.attachments || [];
        // req.body.trailerContents = req.uploadedFiles?.trailerContents || [];

    
        next();
    }
}

export const imageUploadPipelineForUpdateServiceBooking = [
  [
    upload.fields([
      { name: 'attachments', maxCount: 10 }, // Allow up to 10 
    ]),
  ],
  processUploadedFilesForUpdate([
    {
      name: 'attachments',
      folder: TFolderName.serviceBooking,
      required: true, // optional
      allowedMimeTypes: ['image/jpeg', 'image/png'], // , 'application/pdf'
    },
  ]),
];