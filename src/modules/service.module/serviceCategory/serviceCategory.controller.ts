//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceCategory } from './serviceCategory.model';
import { ICreateServiceCategory, IServiceCategory } from './serviceCategory.interface';
import { ServiceCategoryService } from './serviceCategory.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';
import { IUser } from '../../token/token.interface';

export class ServiceCategoryController extends GenericController<
  typeof ServiceCategory,
  IServiceCategory
> {
  ServiceCategoryService = new ServiceCategoryService();

  constructor() {
    super(new ServiceCategoryService(), 'ServiceCategory');
  }

  //----------------------------------
  // 
  //----------------------------------
  create = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateServiceCategory = req.body;
    
    // Translate multiple properties dynamically
    const [nameObj] : [IServiceCategory['name']]  = await Promise.all([
      buildTranslatedField(data.name as string)
    ]);

    data.name = nameObj;
    data.createdBy = (req.user as IUser).role;

    const result = await this.service.create(data as Partial<IServiceCategory>);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
