import { StatusCodes } from 'http-status-codes';
import { ServiceCategory } from './ServiceCategory.model';
import { IServiceCategory } from './ServiceCategory.interface';
import { GenericService } from '../_generic-module/generic.services';


export class ServiceCategoryService extends GenericService<
  typeof ServiceCategory,
  IServiceCategory
> {
  constructor() {
    super(ServiceCategory);
  }
}
