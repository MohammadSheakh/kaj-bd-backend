//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../_generic-module/generic.controller';
import { ContactUs } from './contactUs.model';
import { IContactUs } from './contactUs.interface';
import { ContactUsService } from './contactUs.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

export class ContactUsController extends GenericController<
  typeof ContactUs,
  IContactUs
> {
  contactUsService = new ContactUsService();

  constructor() {
    super(new ContactUsService(), 'ContactUs');
  }

  createOrUpdate = catchAsync(async (req: Request, res: Response) => {
    
    const data = req.body;
    const result = await this.contactUsService.createOrUpdateContactUs(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
