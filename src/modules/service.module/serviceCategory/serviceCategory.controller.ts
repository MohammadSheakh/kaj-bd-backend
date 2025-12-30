//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceCategory } from './serviceCategory.model';
import { ICreateServiceCategory, IServiceCategory, IUpdateServiceCategory } from './serviceCategory.interface';
import { ServiceCategoryService } from './serviceCategory.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';
import { IUser } from '../../token/token.interface';
import ApiError from '../../../errors/ApiError';

export class ServiceCategoryController extends GenericController<
  typeof ServiceCategory,
  IServiceCategory
> {
  ServiceCategoryService = new ServiceCategoryService();

  constructor() {
    super(new ServiceCategoryService(), 'ServiceCategory');
  }

  //----------------------------------
  // Admin | 05-02 | Create Service Category
  //----------------------------------
  create = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateServiceCategory = req.body;
    
    // Translate multiple properties dynamically
    const [nameObj] : [IServiceCategory['name']]  = await Promise.all([
      buildTranslatedField(data.name as string)
    ]);

    if(data.attachments?.length === 0){
      data.attachments = ['69535f1491c6c9abde0ed93e']; // default attachment id for default image
      // this should come from env file
    }
    
    const serviceCategoryDTO:ICreateServiceCategory = {
      attachments : data.attachments,
      name: nameObj,
      createdBy: (req.user as IUser).role
    }

    const result = await this.service.create(serviceCategoryDTO as Partial<IServiceCategory>);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  createByProvider = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateServiceCategory = req.body;
    
    // Translate multiple properties dynamically
    const [nameObj] : [IServiceCategory['name']]  = await Promise.all([
      buildTranslatedField(data.name as string)
    ]);
    
    const serviceCategoryDTO:ICreateServiceCategory = {
      attachments : data.attachments,
      name: nameObj,
      createdBy: (req.user as IUser).role
    }

    const result = await this.service.create(serviceCategoryDTO as Partial<IServiceCategory>);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  //----------------------------------
  // Admin | 05-03 | Update Service Category
  //----------------------------------
  updateById = catchAsync(async (req: Request, res: Response) => {

    const existingCategory = await this.service.getById(req.params.id);
    if (!existingCategory) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${req.params.id} not found`
      );
    }

    const data : IUpdateServiceCategory = req.body;

    if(data.name){
      const [nameObj] : [IServiceCategory['name']]  = await Promise.all([
        buildTranslatedField(data.name as string)
      ]);
      data.name = nameObj
    }

    const serviceCategoryDTO:IUpdateServiceCategory = {
      attachments : req.uploadedFiles.attachments?.[0] ?? existingCategory?.attachments,
      name: data.name ? data.name : existingCategory.name,
      isVisible : data.isVisible,
    }

    const updatedObject = await this.service.updateById(req.params.id, serviceCategoryDTO);

    if (!updatedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${req.params.id} not found`
      );
    }
    //   return res.status(StatusCodes.OK).json(updatedObject);
    sendResponse(res, {
      code: StatusCodes.OK,
      data: updatedObject,
      message: `${this.modelName} updated successfully`,
    });
  });



  // add more methods here if needed or override the existing ones 
}
