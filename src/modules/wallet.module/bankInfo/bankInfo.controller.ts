//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../_generic-module/generic.controller';
import { BankInfo } from './bankInfo.model';
import { IBankInfo } from './bankInfo.interface';
import { BankInfoService } from './bankInfo.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../../token/token.interface';

export class BankInfoController extends GenericController<
  typeof BankInfo,
  IBankInfo
> {
  bankInfoService = new BankInfoService();

  constructor() {
    super(new BankInfoService(), 'BankInfo');
  }

  
  //---------------------------------
  // Specialist / Doctor | create or update bank info
  //---------------------------------
  createOrUpdate = catchAsync(async (req: Request, res: Response) => {
    
    const data:IBankInfo = req.body;

    console.log('data :: ',data )

    data.userId = ((req.user) as IUser).userId as string;

    console.log("logged in user ::", ((req.user) as IUser).userId)

    const result = await this.bankInfoService.createOrUpdate(((req.user) as IUser).userId as string, data);

    if (!result) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'No bankInfo Found',
        success: false,
      });
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created or updated successfully`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
