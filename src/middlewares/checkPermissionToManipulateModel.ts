//@ts-ignore
import { Request, Response, NextFunction } from 'express';
import sendResponse from '../shared/sendResponse';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { IUser } from '../modules/token/token.interface';

//------------------------------
// this method helps us to verify logged in user have connection with 
// this document or not .. that he want to manipulate .. 
//------------------------------
export const checkLoggedInUsersPermissionToManipulateModel = (
    modelName : string, 
    userRelatedToWhichField:string,
    /**
     * if you pass true then we compare _id == req.params.id
     * if you pass false .. you need to provide property key . 
     * with what you want to compare 
     */
    wantToPassResouceId: boolean,
    customKeyNameWithWhatYouWantToComparesTheParamsID?: string
) => {
    return async (req: Request, res:Response, next:NextFunction) => {
        if (!req.user) {
            sendResponse(res, {
                code: StatusCodes.UNAUTHORIZED,
                message: 'You are not authorized',
                success: false,
            });
            return;
        }

        const refModel = mongoose.model(modelName);
        
        if(!wantToPassResouceId){
            const isExistRefference = await refModel.findOne({
                [userRelatedToWhichField]: (req.user as IUser).userId,
                _id : req.params.id
            });

            if(!isExistRefference){
            sendResponse(res, {
                    code: StatusCodes.UNAUTHORIZED,
                    message: 'You are not authorized to manupulate this document',
                    success: false,
                });
            }
        }

        if(customKeyNameWithWhatYouWantToComparesTheParamsID){

            const isExistRefference = await refModel.findOne({
                [userRelatedToWhichField]: (req.user as IUser).userId,
                [customKeyNameWithWhatYouWantToComparesTheParamsID] : req.params.id
            });

            if(!isExistRefference){
            sendResponse(res, {
                    code: StatusCodes.UNAUTHORIZED,
                    message: 'You are not authorized to manupulate this document',
                    success: false,
                });
            }
        
        }

        next();
    }

}