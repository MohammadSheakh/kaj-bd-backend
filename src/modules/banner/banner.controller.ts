//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../_generic-module/generic.controller';
import { Banner } from './banner.model';
import { IBanner } from './banner.interface';
import { BannerService } from './banner.service';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';

export class BannerController extends GenericController<
  typeof Banner,
  IBanner
> {
  BannerService = new BannerService();

  constructor() {
    super(new BannerService(), 'Banner');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:IBanner = req.body;
    
    const serviceCategoryDTO:IBanner = { // this attachments come from middleware
      attachments : data.attachments,
    }

    const result = await this.service.create(serviceCategoryDTO as Partial<IBanner>);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
