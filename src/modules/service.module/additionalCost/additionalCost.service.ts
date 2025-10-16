import { StatusCodes } from 'http-status-codes';
import { AdditionalCost } from './additionalCost.model';
import { IAdditionalCost } from './additionalCost.interface';
import { GenericService } from '../../_generic-module/generic.services';


export class AdditionalCostService extends GenericService<
  typeof AdditionalCost,
  IAdditionalCost
> {
  constructor() {
    super(AdditionalCost);
  }
}
