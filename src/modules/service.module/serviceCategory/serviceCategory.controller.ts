import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceCategory } from './serviceCategory.model';
import { IServiceCategory } from './serviceCategory.interface';
import { ServiceCategoryService } from './serviceCategory.service';

export class ServiceCategoryController extends GenericController<
  typeof ServiceCategory,
  IServiceCategory
> {
  ServiceCategoryService = new ServiceCategoryService();

  constructor() {
    super(new ServiceCategoryService(), 'ServiceCategory');
  }

  // add more methods here if needed or override the existing ones 
}
