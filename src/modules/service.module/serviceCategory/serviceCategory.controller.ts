import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../_generic-module/generic.controller';
import { ServiceCategory } from './ServiceCategory.model';
import { IServiceCategory } from './ServiceCategory.interface';
import { ServiceCategoryService } from './ServiceCategory.service';

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
