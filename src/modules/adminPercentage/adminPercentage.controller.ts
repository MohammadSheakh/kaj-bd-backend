//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../_generic-module/generic.controller';
import { AdminPercentage } from './adminPercentage.model';
import { AdminPercentageService } from './adminPercentage.service';
import { IAdminPercentage } from './adminPercentage.interface';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';

export class AdminPercentageController extends GenericController<
  typeof AdminPercentage,
  IAdminPercentage
> {
  adminPercentageService = new AdminPercentageService();

  constructor() {
    super(new AdminPercentageService(), 'AdminPercentage');
  }


/** ----------------------------------------------
 * @role Admin
 * @Section 
 * @module AdminPercentage |
 * @figmaIndex 0-0
 * @desc Admin can create or update admin percentage
 * 
 *----------------------------------------------*/
createOrUpdateAdminPercentage = catchAsync(async (req:Request, res:Response) => {

  const result = await this.adminPercentageService.createOrUpdateAdminPercentage(
    req.body
  );

  sendResponse(res, {
    code: StatusCodes.OK,
    message: `Admin percentage updated successfully`,
    data: result
  });
});



  // add more methods here if needed or override the existing ones 
}
