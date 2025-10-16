import { StatusCodes } from 'http-status-codes';
import { ServiceCategory } from './serviceCategory.model';
import { IServiceCategory } from './serviceCategory.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class ServiceCategoryService extends GenericService<
  typeof ServiceCategory,
  IServiceCategory
> {
  constructor() {
    super(ServiceCategory);
  }
}
